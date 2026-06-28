export default class Response {
  success(data?: any, param: { [key: string]: any } = {}) {
    const result = { success: true, code: 0, message: '', data }
    if (!data) {
      delete result.data;
    }
    return result;
  }
  failure(message: string, code: number = -1) {
    return { code, message, success: false };
  }
}