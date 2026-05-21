export const FOLLOW_UP_SMS_TIMEZONE = "America/Phoenix";
export const FOLLOW_UP_SMS_START_HOUR = 8;
export const FOLLOW_UP_SMS_END_HOUR = 20;

export function getHourInTimeZone(now = new Date(), timeZone = FOLLOW_UP_SMS_TIMEZONE): number {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;

  if (!hourPart) return 0;

  const hour = Number(hourPart);
  return hour === 24 ? 0 : hour;
}

export function canSendFollowUpSms(now = new Date()) {
  const currentHour = getHourInTimeZone(now, FOLLOW_UP_SMS_TIMEZONE);
  const allowed =
    currentHour >= FOLLOW_UP_SMS_START_HOUR &&
    currentHour < FOLLOW_UP_SMS_END_HOUR;

  return {
    allowed,
    current_hour: currentHour,
    timezone: FOLLOW_UP_SMS_TIMEZONE,
    allowed_window: `${FOLLOW_UP_SMS_START_HOUR}:00-${FOLLOW_UP_SMS_END_HOUR}:00`,
    reason: allowed
      ? undefined
      : `Outside follow-up SMS hours (${FOLLOW_UP_SMS_START_HOUR}:00-${FOLLOW_UP_SMS_END_HOUR}:00 ${FOLLOW_UP_SMS_TIMEZONE})`,
  };
}
