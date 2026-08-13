export type UserRole = "CUSTOMER" | "SELLER" | "SELLER_STAFF" | "ADMIN" | "SUPER_ADMIN";

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  correlationId: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
