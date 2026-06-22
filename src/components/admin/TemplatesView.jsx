/**
 * TemplatesView — Read-only view of canonical email and message templates.
 * Uses EmailCampaignTemplate and MessageTemplate only.
 * No deprecated template entities.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

function TemplateCard({ template, type }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{template.name || template.template_name || 'Untitled'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {type === 'email' && template.subject ? `Subject: ${template.subject}` : (template.channel || template.type || '')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {template.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {template.category}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
          {template.subject && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm text-slate-800">{template.subject}</p>
            </div>
          )}
          {(template.body || template.content) && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Content</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-6">
                {template.body || template.content}
              </p>
            </div>
          )}
          {template.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TemplatesView() {
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [msgTemplates, setMsgTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('email');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [email, msg] = await Promise.all([
        base44.entities.EmailCampaignTemplate.list('-created_date', 200).catch(() => []),
        base44.entities.MessageTemplate.list('-created_date', 200).catch(() => []),
      ]);
      setEmailTemplates(email || []);
      setMsgTemplates(msg || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = (activeTab === 'email' ? emailTemplates : msgTemplates).filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.name || t.template_name || '').toLowerCase().includes(q) ||
      (t.subject || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Templates</h2>
        <p className="text-sm text-slate-500 mt-1">Read-only view of canonical email and message templates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Email Templates ({emailTemplates.length})
        </button>
        <button
          onClick={() => setActiveTab('message')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'message'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Message Templates ({msgTemplates.length})
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search templates…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading templates…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
          No templates found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <TemplateCard key={t.id} template={t} type={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}