const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";

function resolveUrl(url = "") {
  if (/^https?:\/\//i.test(url)) return url;
  if (!BASE_URL) return url;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL.replace(/\/$/, "")}/${url}`;
}

export function httpRequest(options = {}) {
  const { url = "", ...rest } = options;
  return new Promise((resolve, reject) => {
    uni.request({
      url: resolveUrl(url),
      ...rest,
      success: resolve,
      fail: reject,
    });
  });
}
