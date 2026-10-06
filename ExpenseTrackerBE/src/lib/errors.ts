export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const validationError = (message: string) => new ApiError(400, "VALIDATION_ERROR", message);
export const notFound = (message = "Not found") => new ApiError(404, "NOT_FOUND", message);
export const unauthorized = (message = "Authentication is required") => new ApiError(401, "UNAUTHORIZED", message);
