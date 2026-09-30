export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("santripermit_token")
      : null;
  // Di browser pakai URL relatif (/api/...) lewat rewrite Next (next.config.ts),
  // agar tidak tergantung NEXT_PUBLIC_API_URL yang di-bake saat dev start + bebas CORS.
  // Di server (SSR) pakai env absolut.
  const base =
    typeof window !== "undefined"
      ? ""
      : (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${base}/api${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    // Normalisasi semua kegagalan jaringan browser (TypeError: Failed to fetch,
    // Load failed, NetworkError, ECONNREFUSED) jadi satu marker.
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`NetworkError: Failed to fetch API (${detail})`);
  }

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
