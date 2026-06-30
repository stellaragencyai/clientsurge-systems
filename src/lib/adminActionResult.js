export function normalizeAdminActionResult({
  action,
  success = false,
  status = null,
  message = '',
  affected = null,
  failed = null,
  skipped = null,
  retry = null,
  details = [],
  raw = null,
} = {}) {
  const numeric = (value) => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const affectedCount = affected == null ? null : numeric(affected);
  const failedCount = failed == null ? null : numeric(failed);
  const skippedCount = skipped == null ? null : numeric(skipped);

  let finalStatus = status;
  if (!finalStatus) {
    if (success && failedCount && affectedCount && failedCount < affectedCount) finalStatus = 'partial';
    else if (success && failedCount && failedCount > 0) finalStatus = 'warning';
    else if (success) finalStatus = 'success';
    else finalStatus = 'error';
  }

  return {
    action: action || 'Admin action',
    success: Boolean(success),
    status: finalStatus,
    message: message || (success ? 'Action completed.' : 'Action failed.'),
    affected: affectedCount,
    failed: failedCount,
    skipped: skippedCount,
    retry: retry || (success ? '' : 'Review the error, refresh the data, and retry if the input is still valid.'),
    details: Array.isArray(details) ? details.filter(Boolean) : [details].filter(Boolean),
    raw,
    completed_at: new Date().toISOString(),
  };
}

export function errorToAdminActionResult(action, error, fallback = 'Action failed.') {
  return normalizeAdminActionResult({
    action,
    success: false,
    status: 'error',
    message: error?.response?.data?.error || error?.message || fallback,
    retry: 'Refresh the page, verify the selected records are still valid, then retry. If it fails again, check Communication Logs and Failed Jobs.',
    raw: error,
  });
}

export function summarizeActionCounts(result = {}) {
  const parts = [];
  if (result.affected != null) parts.push(`Affected: ${result.affected}`);
  if (result.skipped != null) parts.push(`Skipped: ${result.skipped}`);
  if (result.failed != null) parts.push(`Failed: ${result.failed}`);
  return parts.join(' · ');
}
