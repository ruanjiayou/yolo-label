// 统一响应类型
export interface SuccessResponse<T = any> {
  code: number;
  data: {
    list: T[],
    page?: number,
    more?: boolean,
    total?: number,
    next_cursor?: string,
  } | {
    info: T,
  };
  success: boolean,
  message?: string;
}

export interface ErrorResponse {
  code: number;
  success: false,
  message: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// 查询参数
export interface QueryParams {
  page?: number;
  size?: number;
  sort?: string;
  count?: string;
  cursor?: string;
}