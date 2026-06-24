import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle, Phone, Mail, Copy } from 'lucide-react';

const REGRESSION_LEAD_ID = '6a38d0b4ae4b42c2c3e76799';
const SMS_JOB_ID = '6a38d0c622d349364115c29e';
const EMAIL_JOB_ID = '6a38d0c6f962f3879da36a9b';

export default function MessagingProviderRegressionTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('testMessagingProviders', {
        lead_id: REGRESSION_LEAD_ID,
        test_sms: true,
        test_email: true,
        sms_job_id: SMS_JOB_ID,
        email_job_id: EMAIL_JOB_ID,
      });

      if (!response.data?.success) {
        setError(response.data?.error || 'Test failed');
        return;
      }

      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Messaging Provider Regression Test</h2>
        <p className="text-sm text-muted-foreground">
          Direct deterministic SMS and email send test for failed lead {REGRESSION_LEAD_ID}. Bypasses the broken queue.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Test failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={runTest}
        disabled={loading || !!result}
        className="w-full rounded-lg bg-primary text-white font-semibold py-3 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {result ? 'Test Complete' : loading ? 'Running Test...' : 'Run Full Provider Test'}
      </button>

      {/* Result Panel */}
      {result && (
        <div className="space-y-6">
          {/* Validation Summary */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Lead Validation</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Phone:</span>
                <span className="font-mono">{result.validation.raw_phone || '(missing)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono">{result.validation.email || '(missing)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consent Given:</span>
                <span>{result.validation.consent_given ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SMS Permission:</span>
                <span>{result.validation.sms_permission ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Page:</span>
                <span className="font-mono">{result.validation.source_page || '(none)'}</span>
              </div>
            </div>
          </div>

          {/* SMS Result */}
          {result.results.sms && (
            <div className={`rounded-lg border p-6 ${
              result.results.sms.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                {result.results.sms.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">SMS Provider Test</h3>
                  <p className={`text-sm font-medium mt-1 ${
                    result.results.sms.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.results.sms.success ? '✓ SMS sent' : result.results.sms.skipped ? '⊘ Skipped' : '✗ SMS failed'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {result.results.sms.normalized_phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Normalized Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{result.results.sms.normalized_phone}</span>
                      <button
                        onClick={() => copyToClipboard(result.results.sms.normalized_phone, 'sms-phone')}
                        className="p-1 hover:bg-black/5 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {result.results.sms.message_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Twilio SID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{result.results.sms.message_id}</span>
                      <button
                        onClick={() => copyToClipboard(result.results.sms.message_id, 'sms-sid')}
                        className="p-1 hover:bg-black/5 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {result.results.sms.error && (
                  <div>
                    <span className="text-muted-foreground">Error:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-black/5 rounded">{result.results.sms.error}</p>
                    {result.results.sms.error_code && (
                      <p className="text-xs text-muted-foreground mt-1">Code: {result.results.sms.error_code}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Result */}
          {result.results.email && (
            <div className={`rounded-lg border p-6 ${
              result.results.email.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                {result.results.email.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">Email Provider Test</h3>
                  <p className={`text-sm font-medium mt-1 ${
                    result.results.email.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.results.email.success ? '✓ Email sent' : result.results.email.skipped ? '⊘ Skipped' : '✗ Email failed'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {result.results.email.recipient_email && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Recipient:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{result.results.email.recipient_email}</span>
                      <button
                        onClick={() => copyToClipboard(result.results.email.recipient_email, 'email-to')}
                        className="p-1 hover:bg-black/5 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {result.results.email.message_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Resend ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{result.results.email.message_id}</span>
                      <button
                        onClick={() => copyToClipboard(result.results.email.message_id, 'email-id')}
                        className="p-1 hover:bg-black/5 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {result.results.email.error && (
                  <div>
                    <span className="text-muted-foreground">Error:</span>
                    <p className="font-mono text-xs mt-1 p-2 bg-black/5 rounded">{result.results.email.error}</p>
                    {result.results.email.error_code && (
                      <p className="text-xs text-muted-foreground mt-1">Code: {result.results.email.error_code}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Run ID */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">Test Run ID</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm text-foreground flex-1">{result.test_run_id}</code>
              <button
                onClick={() => copyToClipboard(result.test_run_id, 'test-id')}
                className="p-1 hover:bg-black/5 rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Recommendations</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {result.results.sms?.success && result.results.email?.success && (
                <p>✓ Both SMS and email sent successfully. The broken queue path is the issue, not the providers.</p>
              )}
              {result.results.sms?.error && (
                <p>• SMS failed with Twilio error. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER config.</p>
              )}
              {result.results.email?.error && (
                <p>• Email failed with Resend error. Check RESEND_API_KEY and RESEND_FROM_EMAIL config.</p>
              )}
              {result.results.sms?.skipped || result.results.email?.skipped && (
                <p>• Lead is missing required contact info. Validate lead has email and/or valid phone.</p>
              )}
              <p className="pt-2 font-semibold">Next steps: Check CommunicationEvent records for this lead to see the full event trail.</p>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="w-full rounded-lg border border-border text-foreground font-semibold py-3 hover:bg-muted transition-colors"
          >
            Run Another Test
          </button>
        </div>
      )}
    </div>
  );
}