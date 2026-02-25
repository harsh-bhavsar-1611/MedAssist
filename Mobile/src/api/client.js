const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}, token = null) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const method = options.method || "GET";
  const headers = {
    ...(options.headers || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const body = hasBody
    ? isFormData
      ? options.body
      : typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body)
    : undefined;

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.ok === false)) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export const apiConfig = {
  baseUrl: BASE_URL,
};
