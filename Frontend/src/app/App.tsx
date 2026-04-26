import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import WorldMapPage from './components/WorldMapPage';
import CompanyProfilePage from './components/CompanyProfilePage';
import ApprovalModal from './components/ApprovalModal';
import AuthPage from './components/AuthPage';
import MyTasksPage from './components/MyTasksPage';
import TaskDetailPage from './components/TaskDetailPage';
import CreditsPage from './components/CreditsPage';
import { Toaster } from './components/ui/sonner';
import { useAuthStore } from '../stores/auth';
import { api } from '../lib/api';

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

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [params, setParams] = useState<NavParams>({});
  const [credits, setCredits] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [showApproval, setShowApproval] = useState(false);

  const session = useAuthStore((s) => s.session);
  const initAuth = useAuthStore((s) => s.init);
  const isLoggedIn = !!session;

  // Bootstrap auth session
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  // Refresh credits + pending approvals when logged in
  useEffect(() => {
    if (!session) { setCredits(0); setPendingApprovals(0); return; }
    let cancelled = false;
    (async () => {
      try {
        const [bal, approvals] = await Promise.all([
          api.getCreditsBalance(),
          api.listApprovals(),
        ]);
        if (!cancelled) {
          setCredits(bal.creditsBalance);
          setPendingApprovals(approvals.length);
        }
      } catch { /* ignore — not all screens require this */ }
    })();
    return () => { cancelled = true; };
  }, [session, screen]);

  const nav: AppNav = {
    goto: (s, p = {}) => { setScreen(s); setParams(p); },
    params,
    isLoggedIn,
    credits,
    pendingApprovals,
  };

  const handleLogin = () => {
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
