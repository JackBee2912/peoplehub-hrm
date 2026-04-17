export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  error?: {
    statusCode: number;
    message: string | string[];
    error?: string;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return { success: true, data, meta };
}

export function errorResponse(statusCode: number, message: string | string[], error?: string): ApiResponse {
  return {
    success: false,
    error: { statusCode, message, error },
  };
}
