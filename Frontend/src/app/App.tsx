import { useState } from 'react';
import LandingPage from './components/LandingPage';
import WorldMapPage from './components/WorldMapPage';
import CompanyProfilePage from './components/CompanyProfilePage';
import ApprovalModal from './components/ApprovalModal';
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
    goto: (s, p = {}) => {
      setScreen(s);
      setParams(p);
    },
    params,
    isLoggedIn,
    credits,
    pendingApprovals,
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    nav.goto('world');
  };

  return (
    <div className="size-full dark">
      {screen === 'landing' && (
        <LandingPage nav={nav} onLogin={handleLogin} />
      )}

      {screen === 'world' && (
        <WorldMapPage
          nav={nav}
          onApprovalTrigger={() => setShowApproval(true)}
        />
      )}

      {screen === 'company' && (
        <CompanyProfilePage nav={nav} companyId={params.companyId ?? 'MK'} />
      )}

      {showApproval && (
        <ApprovalModal
          onClose={() => setShowApproval(false)}
          onApprove={() => setShowApproval(false)}
          onReject={() => setShowApproval(false)}
        />
      )}

      <Toaster position="top-right" theme="dark" richColors closeButton />
    </div>
  );
}
