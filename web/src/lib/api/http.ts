import { config } from "@/lib/config";

function requestUrl(url: string) {
  const base = config.apiBase.replace(/\/$/, "");
  return base === "/v1" && url.startsWith("/v1") ? url : `${base}${url}`;
}

export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(requestUrl(url), options);
  const data = (await response.json()) as T & { error?: { message?: string } };
  const result = {
    data: data as T,
    status: response.status,
    headers: response.headers,
  };
  if (!response.ok) throw result;
  return result as T;
}
