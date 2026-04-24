import { useState } from 'react';
import LandingPage from './components/LandingPage';
import WorldMapPage from './components/WorldMapPage';
import CompanyProfilePage from './components/CompanyProfilePage';
import ApprovalModal from './components/ApprovalModal';
import AuthPage from './components/AuthPage';
import MyTasksPage from './components/MyTasksPage';
import TaskDetailPage from './components/TaskDetailPage';
import CreditsPage from './components/CreditsPage';
import { Toaster } from './components/ui/sonner';

export type Screen = 'landing' | 'world' | 'company' | 'tasks' | 'task-detail' | 'credits' | 'auth';

export interface NavParams {
  companyId?: string;
  taskId?: string;
}

export interface AppNav {
  goto: (screen: Screen, params?: NavParams) => void;
  params: NavParams;
  isLoggedIn: boolean;
  credits: number;
  pendingApprovals: number;
}

const MOCK_CREDITS = 150;

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [params, setParams] = useState<NavParams>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credits] = useState(MOCK_CREDITS);
  const [pendingApprovals] = useState(1);
  const [showApproval, setShowApproval] = useState(false);

  const nav: AppNav = {
    goto: (s, p = {}) => { setScreen(s); setParams(p); },
    params,
    isLoggedIn,
    credits,
    pendingApprovals,
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setScreen('world');
    setParams({});
  };

  return (
    <div className="size-full dark">
      {screen === 'landing' && (
        <LandingPage nav={nav} onLogin={handleLogin} />
      )}

      {screen === 'auth' && (
        <AuthPage nav={nav} onSuccess={handleLogin} />
      )}

      {screen === 'world' && (
        <WorldMapPage nav={nav} onApprovalTrigger={() => setShowApproval(true)} />
      )}

      {screen === 'company' && (
        <CompanyProfilePage nav={nav} companyId={params.companyId ?? 'MK'} />
      )}

      {screen === 'tasks' && (
        <MyTasksPage nav={nav} />
      )}

      {screen === 'task-detail' && (
        <TaskDetailPage nav={nav} taskId={params.taskId ?? 't1'} />
      )}

      {screen === 'credits' && (
        <CreditsPage nav={nav} />
      )}

      {showApproval && (
        <ApprovalModal
          agentName="Analytics Agent"
          companyId="AN"
          companyColor="#10B06B"
          tool="send_email"
          args={{
            to: 'board@company.jp',
            subject: 'Q1 Sales Analysis Report',
            body: '{{personalized_content}}',
            attachments: ['q1_report.pdf'],
          }}
          riskLevel="high"
          onClose={() => setShowApproval(false)}
          onApprove={() => setShowApproval(false)}
          onReject={() => setShowApproval(false)}
        />
      )}

      <Toaster position="top-right" theme="dark" richColors closeButton />
    </div>
  );
}
