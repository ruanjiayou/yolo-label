// routes/image.ts
import { Elysia, t } from "elysia";
import client from "../plugins/db";
import { join } from "node:path";
import { unlinkSync, existsSync } from "node:fs";
import Response from "../plugins/response";
import { ImagesInfoInputUpdate } from "../generated/prismabox/ImagesInfo";
import config from "../config";

export const imageRoutes = new Elysia({ prefix: "/api/images" })
  .decorate('Response', new Response())

  // 更新图片标注数组 (包含同步更新项目的 marks 计数逻辑)
  .put("/:id/marks", async ({ params: { id }, body, Response }) => {
    const { marks } = body;

    const updatedImg = await client.imagesInfo.update({
      where: { id },
      data: { marks: JSON.stringify(marks) }
    });

    // 重新计算项目已标注图片的总数
    const projectId = updatedImg.projectId;
    const allImages = await client.imagesInfo.findMany({
      where: { projectId },
      select: { marks: true }
    });
    const marksCount = allImages.filter(img => JSON.parse(img.marks).length > 0).length;

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
      marks: t.Array(t.Any())
    })
  })

  .put("/:id", async ({ params: { id }, body, Response }) => {
    await client.imagesInfo.update({ where: { id }, data: body })
    return Response.success()
  }, { body: ImagesInfoInputUpdate })

  // 删除图片
  .delete("/:id", async ({ params: { id }, Response }) => {
    const image = await client.imagesInfo.findFirst({ where: { id } })
    if (!image) {
      return Response.failure("NotFound")
    }
    const fullpath = join(config.UPLOAD_BASE, image.projectId, image.path)
    if (existsSync(fullpath)) {
      unlinkSync(fullpath)
    }
    await client.imagesInfo.delete({ where: { id } });
    return Response.success()
  });