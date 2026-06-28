export function buildPortalDataTruthStatus({ order, orchestration, installOS, leads, revenue, healthEvents }) {
  const missingSources = [];
  const verifiedSources = [];

  if (order?.id) verifiedSources.push('Order');
  else missingSources.push('Order');

  if (orchestration?.id) verifiedSources.push('OnboardingOrchestration');
  else missingSources.push('OnboardingOrchestration');

  if (installOS?.id) verifiedSources.push('ClientInstallationOS');
  else missingSources.push('ClientInstallationOS');

  if ((leads || []).length > 0) verifiedSources.push('Leads');
  else missingSources.push('Leads');

  if ((revenue || []).length > 0) verifiedSources.push('RevenueTracking');
  else missingSources.push('RevenueTracking');

  if ((healthEvents || []).length > 0) verifiedSources.push('CommunicationEvent');
  else missingSources.push('CommunicationEvent');

  const installVerified = Boolean(order?.client_project_id && installOS?.id);
  const performanceVerified = (leads || []).length > 0 || (healthEvents || []).length > 0 || (revenue || []).length > 0;

  let status = 'missing_proof';
  if (installVerified && performanceVerified) {
    status = 'verified';
  } else if (installVerified) {
    status = 'install_verified_performance_pending';
  } else if (order?.payment_status === 'paid') {
    status = 'paid_but_install_unverified';
  }

  return {
    status,
    install_verified: installVerified,
    performance_verified: performanceVerified,
    verified_sources: verifiedSources,
    missing_sources: missingSources,
    warning: status === 'verified'
      ? ''
      : 'Some dashboard values are based on missing or incomplete source records. Empty metrics are not proof of zero activity.',
  };
}
