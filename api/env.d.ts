declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // 将 DATABASE_URL 锁定为严格的 string 类型
      DATABASE_URL: string;
    }
  }
}

// 确保该文件被视为一个模块（必须加上这行，即使没有导出任何东西）
export {};