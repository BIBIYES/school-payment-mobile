const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";
let isRedirecting = false;

function resolveUrl(url = "") {
  if (/^https?:\/\//i.test(url)) return url;
  if (!BASE_URL) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL.replace(/\/$/, "")}/${url}`;
}

function handleUnauthorized() {
  uni.removeStorageSync("token");
  uni.removeStorageSync("openId");
  if (isRedirecting) return;
  isRedirecting = true;
  uni.showToast({
    title: "登录已过期，请重新登录",
    icon: "none",
    duration: 2000,
  });
  setTimeout(() => {
    uni.reLaunch({ url: "/pages/index/index" });
    isRedirecting = false;
  }, 800);
}

export function httpRequest(options = {}) {
  const { url = "", header = {}, ...rest } = options;

  // 自动添加 Authorization header
  const token = uni.getStorageSync("token");
  const finalHeaders = { ...header };
  if (token && !finalHeaders.Authorization) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: resolveUrl(url),
      header: finalHeaders,
      ...rest,
      success: (res) => {
        const code = res?.data?.code;
        if (res.statusCode === 401 || code === 401 || code === "401") {
          handleUnauthorized();
          const error = new Error(res?.data?.message || "未授权");
          error.code = 401;
          reject(error);
          return;
        }
        resolve(res);
      },
      fail: reject,
    });
  });
}
