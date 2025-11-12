const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";

function resolveUrl(url = "") {
  if (/^https?:\/\//i.test(url)) return url;
  if (!BASE_URL) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL.replace(/\/$/, "")}/${url}`;
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
      success: resolve,
      fail: reject,
    });
  });
}
