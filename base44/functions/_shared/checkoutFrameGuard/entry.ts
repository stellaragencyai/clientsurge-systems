// FIX #5: Block Stripe checkout from iframe context
export function validateCheckoutContext(req) {
  const referer = req.headers.get("referer") || "";
  
  // Detect iframe/preview sandbox contexts
  const isIframe = referer.includes("preview-sandbox") || 
                   referer.includes("base44") ||
                   referer.includes("localhost:5173");
  
  if (isIframe) {
    return {
      blocked: true,
      error: "Checkout is not available in preview mode. Please publish your app to accept payments."
    };
  }
  
  return { blocked: false };
}