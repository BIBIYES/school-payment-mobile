const DEFAULT_APPID =
  import.meta.env?.VITE_WECHAT_APPID || "wx98f0f599c532a7fe";
const DEFAULT_REDIRECT = import.meta.env?.VITE_WECHAT_REDIRECT || "";
const OAUTH_SCOPE = "snsapi_userinfo";

export function buildOAuthUrl() {
  if (typeof window === "undefined") return "";
  const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
  const redirectBase = DEFAULT_REDIRECT || currentUrl;
  const redirectTarget = encodeURIComponent(redirectBase);
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${DEFAULT_APPID}&redirect_uri=${redirectTarget}&response_type=code&scope=${OAUTH_SCOPE}&state=SPAY#wechat_redirect`;
}

export function getQueryParam(name) {
  if (typeof window === "undefined") return "";
  const queryString = window.location.search.substring(1);
  const params = new URLSearchParams(queryString);
  return params.get(name) || "";
}

export function removeQueryParam(param) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete(param);
  window.history.replaceState({}, document.title, url.toString());
}
