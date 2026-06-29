// routes/project.ts
import { Elysia, t } from "elysia";
import client from "../plugins/db";
import { extname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import Response from "../plugins/response";
import config from "../config";
import { calculateFileHash } from "../plugins/hash";

export const projectRoutes = new Elysia({ prefix: "/api/projects" })
  .decorate('Response', new Response())
  // 获取所有项目
  .get("/", async ({ Response }) => {
    const projects = await client.projectInfo.findMany();
    const list = projects.map((p) => ({
      ...p,
      config: JSON.parse(p.config),
    }));
    return Response.success({ list })
  })

  // 创建项目
  .post("/", async ({ body, Response }) => {
    const { title } = body;
    const defaultConfig = JSON.stringify({ total: 0, marks: 0 });

    const newProject = await client.projectInfo.create({
      data: {
        title,
        dir: "", // 后续根据 ID 动态生成或更新
        config: defaultConfig,
      },
    });

    const projectDir = join(config.UPLOAD_BASE, newProject.id);
    await mkdir(projectDir, { recursive: true });

    // 更新实际创建的本地目录路径
    await client.projectInfo.update({
      where: { id: newProject.id },
      data: { dir: newProject.id }
    });

    return Response.success(newProject)
  }, {
    body: t.Object({ title: t.String() })
  })

  // 项目详情
  .get("/:id", async ({ params: { id }, Response }) => {
    const info = await client.projectInfo.findFirst({ where: { id } });
    if (!info) {
      return Response.failure("NotFound")
    }
    const labels = await client.labelsInfo.findMany({ where: { projectId: id } })
    return Response.success({ info: { ...info, config: JSON.parse(info.config), labels } })
  })

  // 删除项目
  .delete("/:id", async ({ params: { id }, Response }) => {
    await client.projectInfo.delete({ where: { id } });
    return Response.success()
  })

  // 获取项目的图片列表
  .get("/:id/images", async ({ params: { id }, Response }) => {
    const images = await client.imagesInfo.findMany({
      where: { projectId: id }
    });
    const list = images.map(img => ({
      ...img,
      marks: JSON.parse(img.marks)
    }));
    return Response.success({ list })
  })

  // 上传图片到对应项目的目录下
  .post("/:id/images", async ({ params: { id }, body, Response }) => {
    // 1. 查找项目是否存在及获取其对应的本地目录
    const project = await client.projectInfo.findUnique({
      where: { id }
    });

    if (!project) {
      return Response.failure('未找到对应的项目')
    }

    // 2. 统一处理单文件与多文件上传（将数据归一化为数组）
    const fileArray = Array.isArray(body.files) ? body.files : [body.files];
    const uploadedImages = [];

    for (const file of fileArray) {
      // 获取后缀名（例如 .JPG -> .jpg）并强制转为小写
      const rawExt = extname(file.name);
      const ext = rawExt.toLowerCase();

      const newId = await calculateFileHash(file)

      const existed = await client.imagesInfo.findFirst({ where: { id: newId } })
      if (existed) {
        console.log(file.name, '已存在')
        continue;
      }

      const newFileName = `${newId}${ext}`;
      const destPath = join(config.UPLOAD_BASE, project.dir, newFileName);

      // 3. 将文件写入到项目的专用文件夹中
      await Bun.write(destPath, file);

      // 4. 将图片记录写入数据库
      const newImage = await client.imagesInfo.create({
        data: {
          id: newId,
          projectId: id,
          path: newFileName,
          marks: "[]" // 默认标注数据为空数组字符串
        }
      });

      uploadedImages.push(newImage);
    }

    // 5. 联动更新项目表中的图片总数 (total)
    const totalCount = await client.imagesInfo.count({
      where: { projectId: id }
    });

    const configObj = JSON.parse(project.config);
    configObj.total = totalCount;

    await client.projectInfo.update({
      where: { id },
      data: { config: JSON.stringify(configObj) }
    });

    return Response.success()
  }, {
    // 使用 TypeBox 对上传的文件类型进行严格校验
    body: t.Object({
      files: t.Union([
        t.File({ type: "image/*" }),
        t.Array(t.File({ type: "image/*" }))
      ])
    })
  })


