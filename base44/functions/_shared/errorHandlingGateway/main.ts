/**
 * Centralized Error Handling Gateway
 * Logs full errors internally, returns sanitized responses to users
 */

export function createErrorResponse(error, statusCode = 500) {
  // Log the full error internally for debugging
  console.error(`[ERROR ${statusCode}]`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Return sanitized response to client
  const genericMessage =
    statusCode === 500 ? "An internal error occurred. Please try again." : "Request failed.";

  return new Response(
    JSON.stringify({
      error: genericMessage,
      status: statusCode,
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function withErrorHandling(handler) {
  return async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      return createErrorResponse(error, 500);
    }
  };
}