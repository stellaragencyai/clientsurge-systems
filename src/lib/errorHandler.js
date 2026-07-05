/**
 * Finding #109: Standard error handling utility.
 * Provides a consistent way to handle and display errors across the app.
 */
import { toast } from "@/components/ui/use-toast";

export function handleError(error, { context = "", showUser = true } = {}) {
  // Log to console for debugging
  console.error(`[Error${context ? `: ${context}` : ""}]`, error);

  // Extract user-friendly message
  const message = extractErrorMessage(error);

  // Show toast to user
  if (showUser) {
    toast({
      title: "Something went wrong",
      description: message,
      variant: "destructive",
    });
  }

  return message;
}

export function extractErrorMessage(error) {
  if (!error) return "An unknown error occurred";

  // Axios-style error
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.message) return error.response.data.message;

  // Base44 SDK error
  if (error.data?.error) return error.data.error;
  if (error.data?.message) return error.data.message;

  // Standard Error
  if (error.message) return error.message;

  // String
  if (typeof error === "string") return error;

  return "An unexpected error occurred. Please try again.";
}

export function logError(error, context = "") {
  console.error(`[Error${context ? `: ${context}` : ""}]`, error);
}