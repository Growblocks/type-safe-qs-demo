import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  RouteQueryParamsProvider,
  getRouteQueryParams,
  shouldRevalidateBasedOnQueryParams,
  useRouteQueryParams,
} from "./queryParams";
import { ShouldRevalidateFunction, useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [{ title: "Foo route" }, { name: "description", content: "Hey!" }];
};

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const { isToggled } = getRouteQueryParams(url.search);

  return {
    message: "Loader says: " + (isToggled ? "Toggled!" : "Not toggled!"),
    isToggled
  };
}

export default function Index() {
  const { message } = useLoaderData<typeof loader>();
  return (
    <RouteQueryParamsProvider defaults={{ }}>
      <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
        <h1>Welcome to Foo!</h1>
        <p>{message}</p>
      </div>
      <MyQsControlledComponent />
    </RouteQueryParamsProvider>
  );
}

function MyQsControlledComponent() {
  const { params, navigateWithParams } = useRouteQueryParams();
  
  return (
    <div>
      <input
        type="checkbox"
        checked={params.isToggled}
        onChange={(e) => {
          navigateWithParams({ isToggled: e.target.checked });
        }}
      />
    </div>
  );
}



export const shouldRevalidate: ShouldRevalidateFunction = (args) => {
    return shouldRevalidateBasedOnQueryParams(args);
};