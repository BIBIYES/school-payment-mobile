import { httpRequest } from "../utils/request";

/**
 * 创建订单
 * @param {Object} data 订单数据
 * @param {number} data.jobId 工种ID
 * @param {string} data.batchName 批次名称
 * @param {string} data.semester 学期
 */
export function createOrder(data) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    httpRequest({
      url: "/api/orders/create",
      method: "POST",
      header: headers,
      data: data,
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "创建订单失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法创建订单");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}

/**
 * 获取我的订单列表
 */
export function getMyOrders() {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    httpRequest({
      url: "/api/orders/list",
      method: "GET",
      header: headers,
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "获取订单列表失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法获取订单列表");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}

/**
 * 获取订单详情
 * @param {string} orderNo 订单号
 */
export function getOrderDetail(orderNo) {
  return new Promise((resolve, reject) => {
    if (!orderNo) {
      reject(new Error("缺少订单号"));
      return;
    }
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    httpRequest({
      url: `/api/orders/${orderNo}`,
      method: "GET",
      header: headers,
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "获取订单详情失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法获取订单详情");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}

/**
 * 创建支付单，返回微信支付参数
 * @param {string} orderNo 订单号
 */
export function createPayment(orderNo) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    httpRequest({
      url: "/wx/js-pay",
      method: "POST",
      header: headers,
      data: { out_trade_no: orderNo },
    })
      .then((res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(body.message || "创建支付失败");
          error.code = body.code || res.statusCode;
          reject(error);
        }
      })
      .catch((err) => {
        const error = new Error(err?.errMsg || "网络异常，无法创建支付");
        error.code = "NETWORK_ERROR";
        reject(error);
      });
  });
}
