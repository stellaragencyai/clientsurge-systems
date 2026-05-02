// Maps product IDs to recommended companion products
export const PRODUCT_RECOMMENDATIONS = {
  "instant-sms": ["nurture-email", "missed-call", "booking-reminder"],
  "nurture-email": ["instant-sms", "reactivation", "case-study"],
  "missed-call": ["instant-sms", "follow-up-sms", "booking-reminder"],
  "booking-reminder": ["instant-sms", "nurture-email", "confirmation-sms"],
  "follow-up-sms": ["nurture-email", "reactivation", "instant-sms"],
  "reactivation": ["nurture-email", "follow-up-sms", "case-study"],
  "case-study": ["testimonial-email", "nurture-email", "booking-reminder"],
  "testimonial-email": ["case-study", "nurture-email", "instant-sms"],
  "confirmation-sms": ["booking-reminder", "instant-sms", "follow-up-sms"],
  "ai-routing": ["instant-sms", "lead-scoring", "nurture-email"],
  "lead-scoring": ["ai-routing", "instant-sms", "reactivation"],
  "integration-hub": ["instant-sms", "nurture-email", "ai-routing"],
};

export function getRecommendedProducts(productId, allProducts) {
  const recommendedIds = PRODUCT_RECOMMENDATIONS[productId] || [];
  return recommendedIds
    .map((id) => allProducts.find((p) => p.product_id === id))
    .filter(Boolean)
    .slice(0, 3);
}