import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PIPELINE_STAGES = [
  { name: 'New', crmStage: 'Not Contacted', color: 'bg-slate-100 text-slate-700' },
  { name: 'Contacted', crmStage: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { name: 'Replied', crmStage: 'Replied', color: 'bg-purple-100 text-purple-700' },
  { name: 'Booked', crmStage: 'Audit Booked', color: 'bg-orange-100 text-orange-700' },
  { name: 'Closed', crmStage: 'Won', color: 'bg-green-100 text-green-700' },
];

export default function SalesPipelineVisual({ onNavigate }) {
  const [stageCounts, setStageCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStageCounts = async () => {
      try {
        const counts = {};
        for (const stage of PIPELINE_STAGES) {
          const result = await base44.asServiceRole.entities.Leads.filter(
            { crm_stage: stage.crmStage },
            'id',
            1
          );
          counts[stage.name] = (result || []).length;
        }
        setStageCounts(counts);
      } catch (e) {
        console.error('Failed to load stage counts:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStageCounts();
  }, []);

  return (
    <div className="bg-card rounded-xl border border-border p-8 space-y-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pipeline...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lead Progression</p>
          <div className="flex items-center justify-between gap-3">
            {PIPELINE_STAGES.map((stage, idx) => (
              <React.Fragment key={stage.name}>
                <button
                  onClick={() => onNavigate('leads')}
                  className={`flex-1 rounded-xl border-2 border-border p-4 text-center transition-all hover:shadow-md cursor-pointer ${stage.color}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75">{stage.name}</p>
                  <p className="text-3xl font-black">{stageCounts[stage.name] || 0}</p>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}