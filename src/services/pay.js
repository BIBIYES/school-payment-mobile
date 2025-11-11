const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8081";

/**
 * 创建 JSAPI 支付单，返回调起微信支付所需参数
 * @param {Object} payload
 * @param {string} payload.out_trade_no 订单号
 */
export function createJsapiOrder(payload) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    uni.request({
      url: `${API_BASE_URL}/wx/js-pay`,
      method: "POST",
      header: headers,
      data: payload,
      success: (res) => {
        const body = res.data || {};
        if (body.success && body.data) {
          resolve(body.data);
        } else {
          const error = new Error(
            body.message || "创建支付订单失败，请稍后重试"
          );
          error.code = body.code || res.statusCode;
          reject(error);
        }
      },
      fail: (err) => {
        const error = new Error(err?.errMsg || "网络异常，无法创建支付订单");
        error.code = "NETWORK_ERROR";
        reject(error);
      },
    });
  });
}
