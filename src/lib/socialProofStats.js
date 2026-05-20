export function countAutomatedBusinesses(orders = []) {
  if (!Array.isArray(orders)) return 0;

  return orders.filter((order) => {
    const paymentStatus = String(order?.payment_status || "").toLowerCase();
    const orderStatus = String(order?.order_status || "").toLowerCase();
    const pipelineStatus = String(order?.pipeline_status || "").toLowerCase();

    return (
      paymentStatus === "paid" ||
      orderStatus.includes("live") ||
      pipelineStatus.includes("live")
    );
  }).length;
}

export function formatAutomatedBusinessesStat(count) {
  const safeCount = Math.max(0, Number.isFinite(Number(count)) ? Number(count) : 0);
  if (safeCount <= 0) return "Businesses automated with ClientSurge";
  return `${safeCount.toLocaleString()} businesses automated`;
}
