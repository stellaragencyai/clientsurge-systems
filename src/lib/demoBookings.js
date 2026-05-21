export const DEMO_BOOKING_STATUSES = [
  { value: "requested", label: "Requested", tone: "#F59E0B" },
  { value: "scheduled", label: "Scheduled", tone: "#00D4FF" },
  { value: "confirmed", label: "Confirmed", tone: "#00FFB3" },
  { value: "completed", label: "Completed", tone: "#6B7280" },
  { value: "no_show", label: "No-Show", tone: "#EF4444" },
  { value: "rescheduled", label: "Rescheduled", tone: "#A78BFA" },
];

export const DEMO_BOOKING_ACTIONS = [
  { value: "completed", label: "Complete" },
  { value: "no_show", label: "No-Show" },
  { value: "rescheduled", label: "Reschedule" },
];

const STATUS_ALIASES = {
  pending: "requested",
  booked: "scheduled",
  "no show": "no_show",
  "no-show": "no_show",
  noshow: "no_show",
  reschedule: "rescheduled",
};

const STATUS_VALUES = new Set(DEMO_BOOKING_STATUSES.map((status) => status.value));

export function normalizeDemoBookingStatus(status) {
  const normalized = String(status || "requested").trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_ALIASES[normalized] || (STATUS_VALUES.has(normalized) ? normalized : "requested");
}

export function getDemoBookingStatusMeta(status) {
  const normalized = normalizeDemoBookingStatus(status);
  return DEMO_BOOKING_STATUSES.find((item) => item.value === normalized) || DEMO_BOOKING_STATUSES[0];
}

export function filterDemoBookingsByStatus(bookings = [], filter = "all") {
  if (filter === "all") {
    return bookings;
  }

  return bookings.filter((booking) => normalizeDemoBookingStatus(booking?.status) === filter);
}

export function formatDemoBookingDateTime(booking = {}, locale = "en-US") {
  if (!booking.scheduled_date) {
    return "Not scheduled";
  }

  const [year, month, day] = String(booking.scheduled_date).split("-").map(Number);
  const date = year && month && day
    ? new Date(year, month - 1, day)
    : new Date(booking.scheduled_date);
  const dateLabel = date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return booking.scheduled_time ? `${dateLabel} at ${booking.scheduled_time}` : dateLabel;
}
