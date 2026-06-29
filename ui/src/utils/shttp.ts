import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import store from '../store';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

type ApiResponse<T> = {
  success: boolean;
  code: number;
  message: string;
  data: {
    list?: T[],
    info?: T
  };
};

type RequestMethod = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) => Promise<T>;

const shttp = axios.create({
  baseURL: store.app.baseURL,
  withCredentials: false,
  timeout: 20000,
});

shttp.interceptors.response.use(
  async (response) => {
    return response.data;
  },
  (error) => {
    console.log(error, 'response error');
    return Promise.reject(error);
  },
);

type PureAxiosInstance = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'> & {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T = any>(url: string, body: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: RequestMethod;
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  patch: RequestMethod;
};

export default shttp as PureAxiosInstance;
