# yolo-label


## 接口部分
> 进入目录: `cd api`

- 安装: `bun install`
- 生成数据库操作代码: `bun run init-client`
- 生成数据口初始文件: `bun run init-data`
- 启动: `bun start`


## 网页界面部分(修改源码)
> 进入目录: `cd ui`

- 安装: `bun install`
- 启动: `bun run dev`

## 打包为单应用文件
- `cd api && bun build --compile ./server.ts --outfile yolo-label-app`

This project was created using `bun init` in bun v1.3.12. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## TODO
- [x] 自动滚到可视区域（图片列表和上传图片列表）
- [x] 图片列表刷新功能
- [x] 调整标注大小后更新数据
- [x] 图片默认显示比例为100%
- [ ] 一键生成数据集支持设置验证集数量({type: 'quantity' | 'percent', value: Number})
- [ ] w为辅助线(常态)切换开关