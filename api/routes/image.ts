// routes/image.ts
import { Elysia, t } from "elysia";
import client from "../client";
import { join } from "node:path";
import { unlinkSync, existsSync } from "node:fs";
import Response from "../plugins/response";

const UPLOAD_BASE = join(process.cwd(), "..", "static");

export const imageRoutes = new Elysia({ prefix: "/api/images" })
  .decorate('Response', new Response())

  // 更新图片标注数据 (包含同步更新项目的 marks 计数逻辑)
  .post("/:id/labels", async ({ params: { id }, body, Response }) => {
    const { labels } = body;

    const updatedImg = await client.imagesInfo.update({
      where: { id },
      data: { labels: JSON.stringify(labels) }
    });

    // 重新计算项目已标注图片的总数
    const projectId = updatedImg.projectId;
    const allImages = await client.imagesInfo.findMany({
      where: { projectId },
      select: { labels: true }
    });
    const marksCount = allImages.filter(img => JSON.parse(img.labels).length > 0).length;

    // 更新项目配置里的 marks
    const project = await client.projectInfo.findUnique({ where: { id: projectId } });
    if (project) {
      const configObj = JSON.parse(project.config);
      configObj.marks = marksCount;
      await client.projectInfo.update({
        where: { id: projectId },
        data: { config: JSON.stringify(configObj) }
      });
    }

    return Response.success()
  }, {
    body: t.Object({
      labels: t.Array(t.Any())
    })
  })

  // 删除图片
  .delete("/:id", async ({ params: { id }, Response }) => {
    const image = await client.imagesInfo.findFirst({ where: { id } })
    if (!image) {
      return Response.failure("NotFound")
    }
    const fullpath = join(UPLOAD_BASE, image.projectId, image.path)
    if (existsSync(fullpath)) {
      unlinkSync(fullpath)
    }
    await client.imagesInfo.delete({ where: { id } });
    return Response.success()
  });