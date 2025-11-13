import { httpRequest } from "../utils/request";

/**
 * 小程序登录
 * @param {string} code 微信登录code
 * @param {string} nickname 用户昵称
 * @param {string} avatarUrl 用户头像URL
 */
export function miniLogin(code, nickname = "", avatarUrl = "") {
  return new Promise((resolve, reject) => {
    httpRequest({
      url: "/api/users/wechat/login",
      method: "POST",
      header: {
        "content-type": "application/json",
      },
      data: { code, nickname, avatarUrl },
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
