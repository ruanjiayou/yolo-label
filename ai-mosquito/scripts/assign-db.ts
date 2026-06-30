import { readdir, stat, mkdir, symlink, rm, } from "fs/promises";
import { join, relative, dirname, basename, } from "path";
import { existsSync, writeFileSync } from "fs";
import { Database } from "bun:sqlite";

// --- 配置区域 ---
const PROJECT_ROOT = process.cwd(); // 项目根目录
const RAW_ROOT = join(PROJECT_ROOT, "../static/public"); // 原始数据目录
const DATASET_ROOT = join(PROJECT_ROOT, "dataset"); // 训练数据集目录

const VAL_GROUP_SIZE = 10; // 每10组取1组作为验证集
const IMG_EXTS = new Set(["jpg", "jpeg", "png"]); // 支持的图片后缀
// --- 配置结束 ---
const filepath = join(PROJECT_ROOT, "../api/database/yolo_label.db");

const db = new Database(filepath, { readonly: true });

interface DataGroup {
  marks: string;
  name: string;
  ext: string;
  dir: string;
}

/**
 * 将数组随机打乱 (Fisher-Yates算法)
 */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
/**
 * 清理并重建目标目录，创建软链接
 */
async function createLinksForGroups(groups: DataGroup[], split: "train" | "verify") {
  const imagesTarget = join(DATASET_ROOT, "images", split);
  const labelsTarget = join(DATASET_ROOT, "labels", split);

  // 确保目标目录存在
  await mkdir(imagesTarget, { recursive: true });
  await mkdir(labelsTarget, { recursive: true });

  for (const group of groups) {
    const imgLinkPath = join(imagesTarget, group.name + "." + group.ext);
    const labelLinkPath = join(labelsTarget, group.name + ".txt");
    // 创建软链接 (使用相对路径，使链接更便携)
    // 计算从链接到源文件的相对路径
    const imgRelativePath = relative(imagesTarget, `${group.dir}/${group.name}.${group.ext}`);
    try {
      await symlink(imgRelativePath, imgLinkPath, "file");
      writeFileSync(labelLinkPath, group.marks)
    } catch (err: any) {
      if (err.code === "EEXIST") {
        // 如果链接已存在，先删除再创建
        await rm(imgLinkPath, { force: true });
        await rm(labelLinkPath, { force: true });
      } else {
        console.error(`创建链接失败: ${group.name}`, err);
      }
    }
  }

  console.log(`✅ ${split} 集: 已创建 ${groups.length} 个链接`);
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 开始准备数据集...");

  // 1. 检查 raw 目录是否存在
  if (!existsSync(RAW_ROOT)) {
    console.error(`❌ 错误: 找不到 raw 目录: ${RAW_ROOT}`);
    process.exit(1);
  }

  // 2. 收集所有数据组
  const project_id = "06c0d1d0-d0d1-4235-87c4-4e92a3c4be60"
  const dir = join(RAW_ROOT, project_id)
  const labels = db.query<{ nth: number, id: string }, any>(`select * from labels_info where project_id="${project_id}" order by nth asc`).all()
  const images = db.query<{ path: string, marks: string }, any>(`select * from images_info where project_id="${project_id}"`).all()
  const allGroups = images
    .map(v => {
      const [name, ext] = v.path.split('.')
      return {
        marks: JSON.parse(v.marks)
          .map((m: any) => ([0, m.cx, m.cy, m.width, m.height].join(' ')))
          .join('\n'),
        name,
        ext,
        dir,
      }
    })
  const total = allGroups.length;
  // return;
  if (total < VAL_GROUP_SIZE) {
    console.error(`❌ 错误: 总组数 (${total}) 少于 ${VAL_GROUP_SIZE}，无法分配验证集，已退出。`);
    process.exit(1);
  }

  // 3. 随机打乱所有数据
  const shuffled = shuffleArray(allGroups);

  // 4. 按每10组分配验证集
  const valGroups: DataGroup[] = [];
  const trainGroups: DataGroup[] = [];

  // 按顺序处理，每10个取第1个作为验证集
  for (let i = 0; i < shuffled.length; i += VAL_GROUP_SIZE) {
    const chunk = shuffled.slice(i, i + VAL_GROUP_SIZE);
    if (chunk.length === VAL_GROUP_SIZE) {
      // 完整的一组10个，随机取1个作为验证集
      const randomIndex = Math.floor(Math.random() * chunk.length);
      const valItem = chunk.splice(randomIndex, 1)[0];
      valGroups.push(valItem);
      trainGroups.push(...chunk);
    } else {
      // 最后一组不足10个，全部放入训练集
      trainGroups.push(...chunk);
      console.log(`ℹ️ 最后一组不足${VAL_GROUP_SIZE}个 (${chunk.length}个)，全部归入训练集`);
    }
  }

  console.log(`📊 分配完成: 训练集 ${trainGroups.length} 组, 验证集 ${valGroups.length} 组`);

  // 5. 清理并重新创建 dataset 目录
  console.log("🧹 正在清理 dataset 目录...");
  await rm(DATASET_ROOT + "/images", { recursive: true, force: true });
  await rm(DATASET_ROOT + "/labels", { recursive: true, force: true });

  // 6. 创建软链接
  console.log("🔗 正在创建软链接...");
  await createLinksForGroups(trainGroups, "train");
  await createLinksForGroups(valGroups, "verify");

  console.log("🎉 数据集准备完成！");
  console.log(`📁 训练集: ${trainGroups.length} 组, 验证集: ${valGroups.length} 组`);
  console.log(`💡 提示: 训练前请确认 dataset 目录中的软链接指向正确的原始文件。`);
}

// 执行主函数
main().catch((err) => {
  console.error("❌ 程序执行出错:", err);
  process.exit(1);
});