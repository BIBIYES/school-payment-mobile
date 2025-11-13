import { httpRequest } from "../utils/request";

/**
 * 获取所有可用的工种列表
 */
export function getJobTypeList() {
  return new Promise((resolve, reject) => {
    httpRequest({
      url: "/api/job-types/list",
      method: "GET",
      header: {
        "content-type": "application/json",
      },
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "获取工种列表失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法获取工种列表");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}
