import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Send, Zap, MessageSquare, TrendingUp,
  AlertTriangle, Activity, Lightbulb, Settings, ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'mission-control',   label: 'Mission Control',          icon: LayoutDashboard },
      { id: 'sales-acquisition', label: 'Sales Acquisition System', icon: Users },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { id: 'leads',         label: 'Leads',              icon: Users },
      { id: 'campaigns',     label: 'Outbound Campaigns', icon: Send },
      { id: 'conversations', label: 'Conversations',       icon: MessageSquare },
      { id: 'funnels',       label: 'Funnel Analytics',   icon: TrendingUp },
    ],
  },
  {
    label: 'Automation',
    items: [
      { id: 'automation',   label: 'Automation Engine', icon: Zap },
      { id: 'ai-insights',  label: 'AI Insights',       icon: Lightbulb },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { id: 'launch-gates',   label: 'Launch Gates',  icon: AlertTriangle },
      { id: 'system-health',  label: 'System Health', icon: Activity },
    ],
  },
  {
    label: 'Admin Tools',
    items: [
      { id: 'simulation-lab', label: 'Simulation Lab', icon: FlaskConical },
    ],
  },
];

export default function MissionControlNavigation({ activeModule, onNavigate }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [leads, automations, events] = await Promise.all([
          base44.asServiceRole.entities.Leads.filter({}, 'id', 1),
          base44.asServiceRole.entities.AutomationRule.filter({}, 'id', 1),
          base44.asServiceRole.entities.CommunicationEvent.filter({}, 'id', 1),
        ]);
        setCounts({
          leads: (leads || []).length,
          automations: (automations || []).length,
          events: (events || []).length,
        });
      } catch (e) {
        console.error('Failed to load counts:', e);
      }
    };
    loadCounts();
  }, []);

  const getCount = (moduleId) => {
    if (moduleId === 'leads') return counts.leads || null;
    if (moduleId === 'automation') return counts.automations || null;
    if (moduleId === 'system-health') return counts.events || null;
    return null;
  };

  return (
    <nav className="flex-1 p-4 overflow-y-auto space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              const count = getCount(item.id);
              const isAdminTool = group.label === 'Admin Tools';

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isAdminTool
                      ? 'text-amber-400 hover:bg-amber-900/30 hover:text-amber-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {count && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                      isActive ? 'bg-white/20' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-slate-700 pt-4">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm font-medium transition-all">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}