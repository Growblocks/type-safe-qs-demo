import { ShouldRevalidateFunctionArgs, useLocation, useNavigate } from '@remix-run/react';
import { isEqual, pick, uniq } from 'lodash-es';
import qs from 'qs';
import React, { createContext, useMemo } from 'react';
import { z } from 'zod';
import { parseConfig, stringifyConfig } from './config';



export function queryParamsFactory<
  ZodShape extends Record<string, z.ZodFirstPartySchemaTypes>,
>(
  shape: ZodShape,
  options: Partial<
    Record<
      keyof ZodShape,
      {
        clientOnly?: boolean;
      }
    >
  >,
) {
  const routeParamsContext = createContext<{
    defaults: { [K in keyof ZodShape]?: z.infer<ZodShape[K]> };
    options: typeof options;
  }>({
    defaults: {},
    options,
  });

  const RouteQueryParamsProvider = ({
    children,
    defaults,
  }: {
    defaults: { [K in keyof ZodShape]?: z.infer<ZodShape[K]> };
    children: React.ReactNode;
  }) => {
    return (
      <routeParamsContext.Provider value={{ defaults, options }}>
        {children}
      </routeParamsContext.Provider>
    );
  };

  const getRouteQueryParams = (
    urlSearch: string,
    defaults: { [K in keyof ZodShape]?: z.infer<ZodShape[K]> } = {},
  ) => {
    const rawParams = qs.parse(urlSearch, parseConfig);

    const schema = z.object(shape);
    const params = schema.parse({ ...defaults, ...rawParams });

    return params;
  };

  const getRouteQueryParamsSafe = (urlSearch: string) => {
    const parsed = qs.parse(urlSearch, parseConfig) as {
      [K in keyof ZodShape]?: z.infer<ZodShape[K]>;
    };

    return pick(parsed, Object.keys(shape));
  };
  
  const useRouteQueryParams = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const { defaults } = React.useContext(routeParamsContext);
    
    const params = useMemo(() => {
      return getRouteQueryParams(search, defaults);
    }, [search, defaults]);
    
    const _navigateWithParams = useMemo(() => {
      return (newParams: typeof params) => {
        const newSearch = qs.stringify(newParams, stringifyConfig);
        navigate({ search: newSearch });
      };
    }, [navigate]);
    
    return {
      params,
      navigateWithParams: _navigateWithParams,
    };
  };
  type ParamsType = ReturnType<typeof useRouteQueryParams>['params'];

  const shouldRevalidateBasedOnQueryParams = (
    args: ShouldRevalidateFunctionArgs,
    revalidateOptions?: {
      excludeQueryParams?: (keyof ParamsType)[];
      excludePathParams?: string[];
      ignoreFormMethod?: boolean;
    },
  ) => {
    const {
      currentUrl,
      nextUrl,
      currentParams: currentPathParams,
      nextParams: nextPathParams,
      formMethod,
    } = args;
    const {
      ignoreFormMethod,
      excludeQueryParams = [],
      excludePathParams = [],
    } = revalidateOptions || {};

    if (!ignoreFormMethod && formMethod === 'POST') return true;

    // only reload when path params that are not excluded change
    const relevantPathParams = Object.keys(currentPathParams).filter(
      (key) => !excludePathParams.includes(key),
    );

    const pathParamsChanged = relevantPathParams.some((key) => {
      return currentPathParams[key] !== nextPathParams[key];
    });

    if (pathParamsChanged) {
      return true;
    }

    const currentQueryParams = getRouteQueryParamsSafe(currentUrl.search);
    const nextQueryParams = getRouteQueryParamsSafe(nextUrl.search);

    const allKeys = uniq(
      Object.keys(currentQueryParams).concat(Object.keys(nextQueryParams)),
    );

    return allKeys.some((key) => {
      if (options[key]?.clientOnly || excludeQueryParams.includes(key)) {
        return false;
      }

      return !isEqual(currentQueryParams[key], nextQueryParams[key]);
    });
  };

  return {
    getRouteQueryParams,
    RouteQueryParamsProvider,
    shouldRevalidateBasedOnQueryParams,
    useRouteQueryParams,
  };
}
