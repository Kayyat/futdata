export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiGet(path) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} falhou (${res.status}) ${text}`);
  }
  return res.json();
}