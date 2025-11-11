import { httpRequest } from "../utils/request";

export function miniLogin(code) {
  return new Promise((resolve, reject) => {
    httpRequest({
      url: "/api/public/mini/login",
      method: "POST",
      header: {
        "content-type": "application/json",
      },
      data: { code },
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "登录失败，请稍后重试");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法登录");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}
