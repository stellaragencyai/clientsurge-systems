import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Send, Zap, MessageSquare, TrendingUp,
  AlertTriangle, Activity, Lightbulb, Settings, ChevronRight,
  Flame, BarChart3, ArrowRight, CheckCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV_ITEMS = [
  { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard },
  { id: 'sales-acquisition', label: 'Sales Acquisition System', icon: Users },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'campaigns', label: 'Outbound Campaigns', icon: Send },
  { id: 'automation', label: 'Automation Engine', icon: Zap },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'funnels', label: 'Funnel Analytics', icon: TrendingUp },
  { id: 'launch-gates', label: 'Launch Gates', icon: AlertTriangle },
  { id: 'ai-insights', label: 'AI Insights', icon: Lightbulb },
  { id: 'system-health', label: 'System Health', icon: Activity },
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
    if (moduleId === 'leads') return counts.leads;
    if (moduleId === 'automation') return counts.automations;
    if (moduleId === 'system-health') return counts.events;
    return null;
  };

  return (
    <nav className="flex-1 p-6 overflow-y-auto space-y-0.5">
      <div className="px-4 py-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 letter-spacing-[0.12em]">Navigation</p>
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        const count = getCount(item.id);

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {count && (
              <span className={`text-xs rounded-full px-2 py-1 font-semibold ${
                isActive ? 'bg-white/20' : 'bg-slate-700 text-slate-300'
              }`}>
                {count}
              </span>
            )}
            {isActive && <ChevronRight className="w-4 h-4" />}
          </button>
        );
      })}

      <div className="border-t border-slate-700 mt-8 pt-6">
        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">System</p>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium transition-all">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}