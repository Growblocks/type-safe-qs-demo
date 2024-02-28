import z from "zod";
import { queryParamsFactory } from "~/query-params/factory";

export const {
  getRouteQueryParams,
  shouldRevalidateBasedOnQueryParams,
  RouteQueryParamsProvider,
  useRouteQueryParams,
} = queryParamsFactory(
  {
    isToggled: z.string().optional().default('false').transform((val) => val === "true"),
  },
  {
    isToggled: {
        clientOnly: true,
    }
  }
);
