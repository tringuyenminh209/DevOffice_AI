import { useEffect, useMemo, useState } from 'react';
import LandingPage from './components/LandingPage';
import WorldMapPage from './components/WorldMapPage';
import CompanyProfilePage from './components/CompanyProfilePage';
import ApprovalModal from './components/ApprovalModal';
import AuthPage from './components/AuthPage';
import MyTasksPage from './components/MyTasksPage';
import TaskDetailPage from './components/TaskDetailPage';
import CreditsPage from './components/CreditsPage';
import { Toaster, toast } from './components/ui/sonner';
import { useAuthStore } from '../stores/auth';
import { useWorldStore } from '../stores/world';
import { api, APIError } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Approval } from '../lib/types';

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

// Map LOW/MEDIUM/HIGH → low/medium/high (ApprovalModal expects lowercase)
function riskLower(r: Approval['riskLevel']): 'low' | 'medium' | 'high' {
  return r.toLowerCase() as 'low' | 'medium' | 'high';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [params, setParams] = useState<NavParams>({});
  const [credits, setCredits] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [activeApproval, setActiveApproval] = useState<Approval | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const session = useAuthStore((s) => s.session);
  const initAuth = useAuthStore((s) => s.init);
  const realCompanies = useWorldStore((s) => s.companies);
  const isLoggedIn = !!session;

  // Bootstrap auth session
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  // Refresh credits + pending approvals when logged in / screen change / tick
  useEffect(() => {
    if (!session) { setCredits(0); setPendingApprovals([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const [bal, approvals] = await Promise.all([
          api.getCreditsBalance(),
          api.listApprovals(),
        ]);
        if (cancelled) return;
        setCredits(bal.creditsBalance);
        setPendingApprovals(approvals);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [session, screen, refreshTick]);

  // Realtime: subscribe approvals INSERT (RLS giới hạn về owner) → auto-popup modal mới
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel('approvals-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'approvals' },
        (payload) => {
          const a = payload.new as Approval;
          if (a.status !== 'pending') return;
          setPendingApprovals((prev) => prev.some(p => p.id === a.id) ? prev : [a, ...prev]);
          // Chỉ auto-popup nếu chưa có modal đang hiển thị
          setActiveApproval((cur) => cur ?? a);
          toast.warning(`新しい承認要求: ${a.actionName}`);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'approvals' },
        (payload) => {
          const a = payload.new as Approval;
          if (a.status !== 'pending') {
            // Resolved bởi tab khác → drop khỏi list
            setPendingApprovals((prev) => prev.filter(p => p.id !== a.id));
            setActiveApproval((cur) => cur?.id === a.id ? null : cur);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  // Find company info for active approval
  const approvalCompany = useMemo(() => {
    if (!activeApproval) return null;
    // Need to find the task → company. We don't have task here; use a simple default.
    // Approvals data includes taskId; loadup happens lazily in modal trigger.
    return realCompanies[0] ?? null;
  }, [activeApproval, realCompanies]);

  const nav: AppNav = {
    goto: (s, p = {}) => { setScreen(s); setParams(p); },
    params,
    isLoggedIn,
    credits,
    pendingApprovals: pendingApprovals.length,
  };

  const handleLogin = () => {
    setScreen('world');
    setParams({});
  };

  const openFirstApproval = async () => {
    if (pendingApprovals.length === 0) {
      toast.info('保留中の承認はありません');
      return;
    }
    setActiveApproval(pendingApprovals[0]);
  };

  const resolveApproval = async (decision: 'approved' | 'rejected') => {
    if (!activeApproval) return;
    try {
      await api.resolveApproval(activeApproval.id, decision);
      toast.success(decision === 'approved' ? '承認しました' : '拒否しました');
      setActiveApproval(null);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      const msg = err instanceof APIError ? err.message : (err as Error).message;
      toast.error(`失敗: ${msg}`);
    }
  };

  return (
    <div className="size-full dark">
      {screen === 'landing' && <LandingPage nav={nav} onLogin={handleLogin} />}
      {screen === 'auth' && <AuthPage nav={nav} onSuccess={handleLogin} />}
      {screen === 'world' && <WorldMapPage nav={nav} onApprovalTrigger={openFirstApproval} />}
      {screen === 'company' && <CompanyProfilePage nav={nav} companyId={params.companyId ?? 'MK'} />}
      {screen === 'tasks' && <MyTasksPage nav={nav} />}
      {screen === 'task-detail' && <TaskDetailPage nav={nav} taskId={params.taskId ?? 't1'} />}
      {screen === 'credits' && <CreditsPage nav={nav} />}

      {activeApproval && (
        <ApprovalModal
          agentName={activeApproval.actionName}
          companyId={approvalCompany?.workflowType ?? 'AI'}
          companyColor={approvalCompany?.buildingColor ?? '#5E55EA'}
          tool={activeApproval.actionName}
          args={activeApproval.actionPayload as Record<string, unknown>}
          riskLevel={riskLower(activeApproval.riskLevel)}
          onClose={() => setActiveApproval(null)}
          onApprove={() => void resolveApproval('approved')}
          onReject={() => void resolveApproval('rejected')}
        />
      )}

      <Toaster position="top-right" theme="dark" richColors closeButton />
    </div>
  );
}
