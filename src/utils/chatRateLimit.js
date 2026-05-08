/**
 * chatBubbleAI rate limiter — #74
 * sessionStorage-based counter. Blocks after 10 messages per session.
 * Drop this logic into the existing chatBubbleAI component's send handler.
 */

const RATE_LIMIT_KEY = 'cs_chat_count';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_MSG = "You've reached the message limit for this session. To continue, please book a call or email us at nolan@clientsurgesystems.com.";

/**
 * Call before sending a chat message.
 * Returns { allowed: boolean, count: number, remaining: number }
 */
export function checkChatRateLimit() {
  const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= RATE_LIMIT_MAX) {
    return { allowed: false, count, remaining: 0, message: RATE_LIMIT_MSG };
  }
  sessionStorage.setItem(RATE_LIMIT_KEY, String(count + 1));
  return { allowed: true, count: count + 1, remaining: RATE_LIMIT_MAX - count - 1 };
}

/**
 * Reset the counter (call on component unmount or session end)
 */
export function resetChatRateLimit() {
  sessionStorage.removeItem(RATE_LIMIT_KEY);
}
