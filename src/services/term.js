import { httpRequest } from "../utils/request";

/**
 * 获取当前开启的学期（可能返回 null）
 */
export function getActiveTerm() {
  return new Promise((resolve, reject) => {
    httpRequest({
      url: "/api/terms/active",
      method: "GET",
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success) {
          resolve(body.data || null);
        } else {
          const error = new Error(body.message || "获取学期信息失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法获取学期信息");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}
