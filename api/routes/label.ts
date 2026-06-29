// routes/label.ts
import { Elysia, t } from "elysia";
import client from "../plugins/db";
import Response from "../plugins/response";

export const labelRoutes = new Elysia({ prefix: "/api/labels" })
  .decorate('Response', new Response())

  // 新增标签
  .post("/", async ({ body, Response }) => {
    const { label, nth, projectId } = body;
    try {
      const info = await client.labelsInfo.create({
        data: { label, nth, projectId }
      });
      return Response.success({ info })
    } catch (e: any) {
      return Response.failure(e.message)
    }
  }, {
    body: t.Object({
      label: t.String(),
      nth: t.Number(),
      projectId: t.String(),
    })
  })

  .get("/", async ({ Response }) => {
    const list = await client.labelsInfo.findMany()
    return Response.success({ list })
  })

  // 修改标签
  .put("/:id", async ({ params: { id }, body, Response }) => {
    await client.labelsInfo.update({
      where: { id },
      data: body
    });
    return Response.success()
  }, {
    body: t.Object({
      label: t.Optional(t.String()),
      nth: t.Optional(t.Integer())
    })
  })

  // 删除标签
  .delete("/:id", async ({ params: { id }, Response }) => {
    const label = await client.labelsInfo.findFirst({ where: { id } });
    if (!label) {
      return Response.failure('NotFound')
    }
    await client.labelsInfo.delete({ where: { id } });
    const labels = await client.labelsInfo.findMany({ where: { projectId: label.projectId }, orderBy: { nth: 'asc' } })
    await client.$transaction(labels.map((item, nth) => client.labelsInfo.update({ where: { id: item.id }, data: { nth } })))
    return Response.success()
  });