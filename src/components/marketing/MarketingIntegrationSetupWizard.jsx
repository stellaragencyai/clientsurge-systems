import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Video, Image as ImageIcon, Megaphone, CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

const PLATFORM_CONFIG = {
  linkedin: {
    label: 'LinkedIn',
    icon: Users,
    color: 'blue',
    scopes: ['openid', 'profile', 'email', 'w_organization_social', 'r_organization_social', 'r_organization_admin', 'rw_organization_admin'],
    setupSteps: [
      'Confirm or create a LinkedIn account for ClientSurge Systems',
      'Create or verify a LinkedIn Company Page for ClientSurge Systems',
      'Confirm you are an Administrator / Content Admin for the company page',
      'Connect the LinkedIn integration through Base44',
      'If custom API setup needed: create a LinkedIn Developer app at developer.linkedin.com',
      'Configure OAuth redirect URI using the Base44 callback URL',
      'Request permissions for posting and reading post performance',
      'Verify posting capability with a test post or API validation',
    ],
    canPublish: true,
    publishNote: 'LinkedIn supports organic company page posts via w_organization_social scope.',
  },
  tiktok: {
    label: 'TikTok',
    icon: Video,
    color: 'pink',
    scopes: ['user.info.basic', 'user.info.profile', 'user.info.stats', 'video.list'],
    setupSteps: [
      'Create or verify a TikTok account for ClientSurge Systems',
      'Create or verify a TikTok for Developers app if needed',
      'Add the Content Posting API product',
      'Enable Direct Post configuration if available',
      'Configure OAuth redirect URI using the Base44 callback URL',
      'Verify the ClientSurge domain / URL prefix if TikTok requires hosted media URLs',
      'Request posting scope including video publishing capability',
      'IMPORTANT: Base44 TikTok connector is read-only (profile/stats). Video publishing requires a custom TikTok Developer App.',
      'If TikTok app audit is required before public posting, status shows "Audit Required" until approved.',
    ],
    canPublish: false,
    publishNote: 'Base44 TikTok connector is read-only. Video publishing requires a custom TikTok Developer App with Content Posting API access.',
  },
  instagram_business: {
    label: 'Instagram Business',
    icon: ImageIcon,
    color: 'purple',
    scopes: ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_comments'],
    setupSteps: [
      'Create or verify an Instagram Business or Creator account for ClientSurge Systems',
      'Connect the Instagram account to the ClientSurge Facebook Page / Meta Business setup',
      'Confirm Meta Business Suite access',
      'Create or verify a Meta Developer app if needed',
      'Configure OAuth redirect URI using the Base44 callback URL',
      'Request Meta permissions for Instagram business content publishing and insights',
      'Support publishing image posts, video posts, Reels, and carousel posts',
      'Use official Meta / Instagram APIs only — no scraping or browser automation',
      'Verify publish capability with a media-container-to-publish flow test',
    ],
    canPublish: true,
    publishNote: 'Instagram supports image, video, Reels, and carousel posts via Instagram Graph API.',
  },
  facebook_ads: {
    label: 'Facebook Ads (Planning Only)',
    icon: Megaphone,
    color: 'blue',
    scopes: [],
    setupSteps: [
      'Add Facebook Page ID for ClientSurge Systems',
      'Add Meta Business ID',
      'Add Ad Account ID',
      'Add Pixel ID for conversion tracking',
      'Verify website domain verification status',
      'This is read-only / planning mode — no live ad spend without explicit approval',
      'The platform generates ad ideas, copy, audiences, and campaign drafts only',
      '"Boost Winning Post" feature is disabled until manually approved',
    ],
    canPublish: false,
    publishNote: 'Facebook Ads module is DRAFT ONLY. No live ad spend without explicit manual approval.',
  },
};

export default function MarketingIntegrationSetupWizard({ channels, onRefresh }) {
  const [expandedPlatform, setExpandedPlatform] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const getChannel = (platform) => channels.find(c => c.platform === platform);

  const [connectMessage, setConnectMessage] = useState(null);

  const handleConnect = async (platform) => {
    setConnecting(platform);
    setConnectMessage(null);
    try {
      if (platform === 'linkedin') {
        setConnectMessage({
          platform,
          type: 'info',
          text: 'LinkedIn OAuth must be initiated by the AI assistant. In the Base44 chat, ask: "Connect the LinkedIn integration with scopes: openid, profile, email, w_organization_social, r_organization_social, rw_organization_admin."',
        });
      } else if (platform === 'tiktok') {
        setConnectMessage({
          platform,
          type: 'warning',
          text: 'TikTok Base44 connector is read-only (profile/stats only). Video publishing requires a custom TikTok Developer App with Content Posting API. You can still connect for profile stats, but publishing will remain blocked.',
        });
      } else if (platform === 'instagram_business') {
        setConnectMessage({
          platform,
          type: 'info',
          text: 'Instagram OAuth must be initiated by the AI assistant. In the Base44 chat, ask: "Connect the Instagram integration with scopes: instagram_business_basic, instagram_business_content_publish, instagram_business_manage_comments." You also need a Meta Business account with an Instagram Business account linked to a Facebook Page.',
        });
      } else if (platform === 'facebook_ads') {
        setConnectMessage({
          platform,
          type: 'warning',
          text: 'Facebook Ads module is draft-only. No OAuth connection needed. No ads will be created or launched.',
        });
      }
    } catch (e) {
      console.error('Connection failed:', e);
      setConnectMessage({ platform, type: 'error', text: 'Connection failed: ' + e.message });
    } finally {
      setConnecting(null);
    }
  };

  const handleVerify = async (platform) => {
    setVerifying(platform);
    try {
      const ch = getChannel(platform);
      const now = new Date().toISOString();
      if (ch) {
        await base44.entities.SocialChannelConnection.update(ch.id, {
          last_verified_at: now,
          setup_notes: (ch.setup_notes || '') + `\n[${now}] Manually verified by admin`,
        });
      }
      onRefresh();
    } catch (e) {
      console.error('Verify failed:', e);
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm">Integration Setup Wizard</h3>
            <p className="text-amber-800 text-sm mt-1">
              Follow the steps for each platform. Connections are not marked "Ready to Publish" until verified.
              No API secrets are stored in chat — OAuth is used wherever possible.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(PLATFORM_CONFIG).map(([platformKey, config]) => {
        const Icon = config.icon;
        const channel = getChannel(platformKey);
        const isConnected = channel?.connected_status === 'connected';
        const isReady = channel?.publish_capability_status === 'ready_to_publish';
        const isExpanded = expandedPlatform === platformKey;

        return (
          <div key={platformKey} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setExpandedPlatform(isExpanded ? null : platformKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{config.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isConnected ? (isReady ? '✅ Ready to Publish' : '⚠️ Connected — Publish Not Ready') : '❌ Not Connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {!isConnected && <XCircle className="w-5 h-5 text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Publish capability notice */}
                <div className={`rounded-lg p-3 text-sm ${config.canPublish ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  <strong>Publish Capability:</strong> {config.publishNote}
                </div>

                {/* Setup steps */}
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-2">Setup Steps:</h4>
                  <ol className="space-y-1.5">
                    {config.setupSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-xs font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Connection details */}
                {channel && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Account Name:</span><span className="font-medium text-foreground">{channel.account_name || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account ID:</span><span className="font-medium text-foreground">{channel.account_id || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Page/Org ID:</span><span className="font-medium text-foreground">{channel.page_id || channel.organization_id || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Permissions:</span><span className="font-medium text-foreground">{(channel.permissions_granted || []).join(', ') || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Token Expires:</span><span className="font-medium text-foreground">{channel.token_expires_at ? new Date(channel.token_expires_at).toLocaleString() : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last Verified:</span><span className="font-medium text-foreground">{channel.last_verified_at ? new Date(channel.last_verified_at).toLocaleString() : 'Never'}</span></div>
                    {channel.error_message && <div className="text-red-500 mt-1">Error: {channel.error_message}</div>}
                  </div>
                )}

                {/* Connect message */}
                {connectMessage && connectMessage.platform === platformKey && (
                  <div className={`rounded-lg p-3 text-sm ${
                    connectMessage.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    connectMessage.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {connectMessage.text}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {!isConnected && platformKey !== 'facebook_ads' && (
                    <button
                      onClick={() => handleConnect(platformKey)}
                      disabled={connecting === platformKey}
                      className="cs-btn-primary text-sm disabled:opacity-50"
                    >
                      {connecting === platformKey ? <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting...</> : `Connect ${config.label}`}
                    </button>
                  )}
                  {isConnected && (
                    <button
                      onClick={() => handleVerify(platformKey)}
                      disabled={verifying === platformKey}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      {verifying === platformKey ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify Connection'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}