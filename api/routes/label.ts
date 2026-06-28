// routes/label.ts
import { Elysia, t } from "elysia";
import client from "../client";
import Response from "../plugins/response";

export const labelRoutes = new Elysia({ prefix: "/api/labels" })
  .decorate('Response', new Response())

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
    await client.labelsInfo.delete({ where: { id } });
    return Response.success()
  });