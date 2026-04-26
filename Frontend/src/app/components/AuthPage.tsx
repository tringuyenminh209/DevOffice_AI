import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from './ui/sonner';
import type { AppNav } from '../App';
import { useAuthStore } from '../../stores/auth';

type AuthTab = 'login' | 'register';

export default function AuthPage({
  nav,
  onSuccess,
  defaultTab = 'login',
}: {
  nav: AppNav;
  onSuccess: () => void;
  defaultTab?: AuthTab;
}) {
  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('メールとパスワードを入力してください'); return; }
    if (tab === 'register' && !name) { setError('名前を入力してください'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, password);
        toast.success('ログインしました');
      } else {
        await signUp(email, password);
        toast.success('アカウント作成完了');
      }
      onSuccess();
    } catch (err) {
      const msg = (err as Error).message || 'エラーが発生しました';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('Google サインインは Phase G で実装予定です');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-surface border-r border-border p-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-[15px]">DevOffice AI</span>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-[28px] font-bold leading-tight">
            5つのAI企業が<br />
            <span className="text-primary">常時待機中。</span>
          </h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            タスクを依頼するだけで、AI企業が代行。World Map でリアルタイムに作業を確認し、平均30分で成果物を受け取れる。
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {[
              { label: 'Building View で作業過程を可視化' },
              { label: '承認ゲートで高リスク操作を事前確認' },
              { label: '平均30分以内にタスク完了' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#5E55EA" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-[13px] text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">© 2026 DevOffice AI — チーム「イキイキとした毎日」</p>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] flex flex-col gap-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-[15px]">DevOffice AI</span>
          </div>

          {/* Tabs */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold">
              {tab === 'login' ? 'ログイン' : 'アカウント作成'}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {tab === 'login' ? 'アカウントにサインインする' : '無料で始める — クレジットカード不要'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg bg-card border border-border p-0.5">
            {(['login', 'register'] as AuthTab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-1.5 rounded-md text-[13px] font-medium transition-colors"
                style={{
                  backgroundColor: tab === t ? '#1D202B' : 'transparent',
                  color: tab === t ? '#EAEDEC' : '#7D8BA3',
                }}
              >
                {t === 'login' ? 'ログイン' : '新規登録'}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full h-10 text-[13px] gap-2"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google で続ける
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">または</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-muted-foreground">名前</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田 太郎"
                  className="h-10 rounded-lg bg-card border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-muted-foreground">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 rounded-lg bg-card border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-muted-foreground">パスワード</label>
                {tab === 'login' && (
                  <button type="button" className="text-[11px] text-primary hover:underline">
                    忘れた場合
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 rounded-lg bg-card border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <p className="text-[12px] text-crimson">{error}</p>
            )}

            <Button
              type="submit"
              className="h-10 bg-primary hover:bg-primary/90 text-[13px] font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  処理中...
                </span>
              ) : tab === 'login' ? 'ログイン' : 'アカウントを作成'}
            </Button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center">
            {tab === 'login' ? (
              <>アカウントをお持ちでない方は{' '}
                <button className="text-primary hover:underline" onClick={() => setTab('register')}>新規登録</button>
              </>
            ) : (
              <>すでにアカウントをお持ちの方は{' '}
                <button className="text-primary hover:underline" onClick={() => setTab('login')}>ログイン</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
