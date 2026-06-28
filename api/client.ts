import { PrismaClient } from "./generated/prisma/client";
import { PrismaBunSqlite } from 'prisma-adapter-bun-sqlite';

const adapter = new PrismaBunSqlite({ url: process.env.DATABASE_URL });
const client = new PrismaClient({ adapter });

export default client;