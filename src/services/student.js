import { httpRequest } from "../utils/request";

/**
 * 获取当前学生的个人资料
 */
export function getProfile() {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    httpRequest({
      url: "/api/public/students/profile",
      method: "GET",
      header: headers,
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "获取个人信息失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法获取个人信息");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}

/**
 * 更新当前学生的个人资料
 * @param {Object} data 学生信息
 */
export function updateProfile(data) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    httpRequest({
      url: "/api/public/students/profile",
      method: "PUT",
      header: headers,
      data: data,
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "更新个人信息失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法更新个人信息");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}
