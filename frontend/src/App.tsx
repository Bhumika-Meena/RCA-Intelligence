import React from 'react';
import { Navbar } from './components/Navbar';
import { CopilotPanel } from './components/CopilotPanel';
import { IncidentHeader } from './components/IncidentHeader';
import { FiveWhysView } from './components/FiveWhysView';
import { SixMCards } from './components/SixMCards';
import { EvidenceGapList } from './components/EvidenceGapList';
import { RootCauseList } from './components/RootCauseList';
import { CapaSection } from './components/CapaSection';
import { ReviewSection } from './components/ReviewSection';
import { SavedInvestigationsModal } from './components/SavedInvestigationsModal';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: AI Quality Copilot Panel */}
        <CopilotPanel />

        {/* Right Side: Interactive RCA & CAPA Record Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-h-[calc(100vh-4rem)]">
          <div className="max-w-5xl mx-auto space-y-6">
            <IncidentHeader />
            <FiveWhysView />
            <SixMCards />
            <EvidenceGapList />
            <RootCauseList />
            <CapaSection />
            <ReviewSection />
          </div>
        </div>
      </main>

      {/* Saved Records Drawer / Modal */}
      <SavedInvestigationsModal />
    </div>
  );
};

export default App;
