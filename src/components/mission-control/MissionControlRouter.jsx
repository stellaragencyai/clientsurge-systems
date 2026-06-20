import React, { useState } from 'react';
import MissionControlLayout from './MissionControlLayout';
import MissionControlDashboard from './MissionControlDashboard';
import SalesAcquisitionModule from './SalesAcquisitionModule';
import AutomationEngineModule from './AutomationEngineModule';
import FunnelAnalyticsModule from './FunnelAnalyticsModule';
import LaunchGatesModule from './LaunchGatesModule';
import SystemHealthModule from './SystemHealthModule';
import SystemSimulationLab from './SystemSimulationLab';
import ImprovementReviewQueue from './ImprovementReviewQueue';
import FailureHandlingMonitorPanel from './FailureHandlingMonitorPanel';

const MODULE_COMPONENTS = {
  'mission-control': MissionControlDashboard,
  'sales-acquisition': SalesAcquisitionModule,
  'automation': AutomationEngineModule,
  'funnels': FunnelAnalyticsModule,
  'launch-gates': LaunchGatesModule,
  'system-health': SystemHealthModule,
  'simulation-lab': SystemSimulationLab,
  'improvement-review': ImprovementReviewQueue,
  'failure-monitor': FailureHandlingMonitorPanel,
  // stubs for future modules
  'leads': MissionControlDashboard,
  'campaigns': MissionControlDashboard,
  'conversations': MissionControlDashboard,
  'ai-insights': MissionControlDashboard,
};

export default function MissionControlRouter() {
  const [activeModule, setActiveModule] = useState('mission-control');

  const Component = MODULE_COMPONENTS[activeModule] || MissionControlDashboard;

  const handleNavigate = (moduleId) => {
    setActiveModule(moduleId);
    // Smooth scroll to top
    setTimeout(() => {
      document.querySelector('[class*="flex-1"]')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  return (
    <MissionControlLayout activeModule={activeModule} onNavigate={handleNavigate}>
      <Component onNavigate={handleNavigate} />
    </MissionControlLayout>
  );
}