class AppError extends Error {
  constructor(statusCode, error, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.name = "AppError";
  }
}
function createErrorResponse(statusCode, error, message, details) {
  return {
    status: statusCode,
    body: {
      error,
      message,
      details
    }
  };
}
function handleError(error) {
  console.error("API Error:", error);
  if (error instanceof AppError) {
    return createErrorResponse(error.statusCode, error.error, error.message, error.details);
  }
  if (error instanceof Error) {
    return createErrorResponse(500, "internal_server_error", "Wystąpił błąd serwera", { message: error.message });
  }
  return createErrorResponse(500, "unknown_error", "Wystąpił nieznany błąd");
}

export { AppError as A, handleError as h };
