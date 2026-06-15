/**
 * Task 28 — Admin setting change alerts
 * Notifies when AdminSettings or pricing tiers are modified
 */

export function buildAdminChangeAlert({ changedBy, entityName, changedFields, before, after }) {
  return {
    subject: `[ClientSurge Admin] ${entityName} settings changed by ${changedBy}`,
    body: `
      <h2>Admin Settings Changed</h2>
      <p><strong>Entity:</strong> ${entityName}</p>
      <p><strong>Changed by:</strong> ${changedBy}</p>
      <p><strong>Fields changed:</strong> ${changedFields.join(', ')}</p>
      <h3>Before:</h3>
      <pre>${JSON.stringify(before, null, 2)}</pre>
      <h3>After:</h3>
      <pre>${JSON.stringify(after, null, 2)}</pre>
      <p><em>Timestamp: ${new Date().toISOString()}</em></p>
    `.trim(),
  };
}

/**
 * Determines which fields changed between two settings objects
 */
export function diffSettings(before = {}, after = {}) {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Array.from(allKeys).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}