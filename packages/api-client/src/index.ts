import type { ApiError, ApiResponse } from "@marketplace/types";

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly details: ApiError) {
    super(details.message);
  }
}

export function createApiClient(baseUrl: string, getAccessToken?: () => string | undefined) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getAccessToken?.();
    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body = (await response.json()) as ApiResponse<T> | ApiError;
    if (!response.ok) throw new ApiClientError(response.status, body as ApiError);
    return (body as ApiResponse<T>).data;
  };
}
