// server.ts
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import client from './client'

// 引入拆分的路由子模块
import { projectRoutes } from "./routes/project";
import { labelRoutes } from "./routes/label";
import { imageRoutes } from "./routes/image";

const UPLOAD_BASE = join(process.cwd(), "..", "static");

const app = new Elysia()
  .use(cors())
  // 静态文件服务：方便前端读取图片
  .use(
    staticPlugin({
      prefix: "/static",
      assets: UPLOAD_BASE,
      alwaysStatic: true // 优化静态资源响应性能
    })
  )
  // 链式加载路由模块
  .use(projectRoutes)
  .use(labelRoutes)
  .use(imageRoutes)

  .listen(3001);

console.log(`Backend running at http://localhost:3001`);