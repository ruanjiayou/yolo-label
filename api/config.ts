import { join } from "node:path";

const config = {
  PORT: process.env.PORT as any as number,
  DATABASE_URL: process.env.DATABASE_URL as string,
  UPLOAD_BASE: join(process.cwd(), process.env.STATIC_DIR as string),
}

export default config;