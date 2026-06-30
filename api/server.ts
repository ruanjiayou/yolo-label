// server.ts
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import config from "./config";

// 引入拆分的路由子模块
import { projectRoutes } from "./routes/project";
import { labelRoutes } from "./routes/label";
import { imageRoutes } from "./routes/image";

const app = new Elysia()
  .use(cors())
  // 静态文件服务：方便前端读取图片
  .use(
    staticPlugin({
      prefix: "/static",
      assets: config.UPLOAD_BASE,
      alwaysStatic: false,
    })
  )
  // 链式加载路由模块
  .use(projectRoutes)
  .use(labelRoutes)
  .use(imageRoutes)

  .listen(config.PORT);

console.log(`Backend running at http://localhost:${config.PORT}`);