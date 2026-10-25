import { serve } from "@hono/node-server";
import { join } from "node:path";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4810);
const staticRoot = port === 4810 ? join(process.cwd(), "dist") : undefined;

serve({
  fetch: createApp({ staticRoot }).fetch,
  hostname: "127.0.0.1",
  port,
});
console.log(`角色模卡工作室：http://127.0.0.1:${port}`);
