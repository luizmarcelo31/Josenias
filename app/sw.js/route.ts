import { createSerwistRoute } from "@serwist/turbopack";

export const GET = createSerwistRoute({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});
