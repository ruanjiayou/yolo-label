bun build --compile --target=bun-darwin-arm64 ./api/server.ts --outfile ./yolo-label/yolo-label-darwin-arm64
bun build --compile --target=bun-darwin-x64 ./api/server.ts --outfile ./yolo-label/yolo-label-darwin-x64
bun build --compile --target=bun-linux-x64 ./api/server.ts --outfile ./yolo-label/yolo-label-linux-x64
bun build --compile --target=bun-linux-arm64 ./api/server.ts --outfile ./yolo-label/yolo-label-linux-arm64
bun build --compile --target=bun-windows-x64 ./api/server.ts --outfile ./yolo-label/yolo-label-windows-x64
cp -R .env static/index.html static/assets ./yolo-label