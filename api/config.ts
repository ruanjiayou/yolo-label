import { join } from "node:path";

const config = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  UPLOAD_BASE: join(process.cwd(), "..", "static/public"),
}

export default config;