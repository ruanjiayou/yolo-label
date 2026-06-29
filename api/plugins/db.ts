import { PrismaClient } from "../generated/prisma/client";
import { PrismaBunSqlite } from 'prisma-adapter-bun-sqlite';
import config from "../config.ts"

const adapter = new PrismaBunSqlite({ url: config.DATABASE_URL });
const client = new PrismaClient({ adapter });

export default client;