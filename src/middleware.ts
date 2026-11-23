import { defineMiddleware } from "astro:middleware";
import { wwwRedirect } from "./lib/www-redirect";

export const onRequest = defineMiddleware((context, next) => {
  const target = wwwRedirect(new URL(context.request.url));
  if (target) return Response.redirect(target, 301);
  return next();
});
