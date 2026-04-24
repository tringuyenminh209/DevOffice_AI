import { useState } from 'react';
import { Button } from './ui/button';
import type { AppNav } from '../App';

interface Transaction {
  id: string;
  type: 'used' | 'purchased';
  amount: number;
  description: string;
  date: string;
  companyId?: string;
  companyColor?: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'used',      amount: -10,  description: 'ランディングページのコピーライティング', date: '2026-04-24', companyId: 'MK', companyColor: '#DA3950' },
  { id: 'tx2', type: 'used',      amount: -12,  description: '利用規約の法的チェック',                date: '2026-04-23', companyId: 'LG', companyColor: '#9333EA' },
  { id: 'tx3', type: 'used',      amount: -10,  description: 'SNSキャンペーン企画',                   date: '2026-04-21', companyId: 'MK', companyColor: '#DA3950' },
  { id: 'tx4', type: 'purchased', amount: +150, description: 'Standard プラン — クレジット購入',      date: '2026-04-20' },
  { id: 'tx5', type: 'used',      amount: -15,  description: 'Webアプリ開発サポート',                 date: '2026-04-18', companyId: 'DV', companyColor: '#5E55EA' },
  { id: 'tx6', type: 'used',      amount: -8,   description: '業界レポート作成',                      date: '2026-04-15', companyId: 'RS', companyColor: '#267ADE' },
  { id: 'tx7', type: 'purchased', amount: +50,  description: 'Starter プラン — クレジット購入',       date: '2026-04-10' },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'STR',
    credits: 50,
    price: '¥500',
    features: ['50クレジット', '有効期限: 90日', '全5社利用可能', 'メールサポート'],
    color: '#267ADE',
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    badge: 'STD',
    credits: 150,
    price: '¥1,200',
    features: ['150クレジット (20%お得)', '有効期限: 180日', '全5社利用可能', '優先サポート', '履歴: 無制限保存'],
    color: '#5E55EA',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'PRO',
    credits: 500,
    price: '¥3,500',
    features: ['500クレジット (30%お得)', '有効期限: 365日', '全5社利用可能', '専任サポート', 'API アクセス (β)'],
    color: '#10B06B',
    popular: false,
  },
];

export default function CreditsPage({ nav }: { nav: AppNav }) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId);
    await new Promise(r => setTimeout(r, 1500));
    setPurchasing(null);
    setPurchased(planId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 bg-surface border-b border-border flex items-center gap-3 px-6 shrink-0">
        <button
          onClick={() => nav.goto('world')}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          World Map
        </button>
        <span className="text-muted-foreground text-[13px]">/</span>
        <span className="text-[13px] font-semibold">クレジット</span>
      </header>

      <div className="flex-1 max-w-[960px] w-full mx-auto px-6 py-8">
        {/* Balance card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5E55EA" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-0.5">現在の残高</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[38px] font-bold leading-none">{nav.credits}</span>
              <span className="text-[15px] text-muted-foreground font-medium">クレジット</span>
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-muted-foreground mb-0.5">平均タスクコスト</p>
            <p className="text-[20px] font-bold">10–15 cr</p>
            <p className="text-[11px] text-muted-foreground">/ タスク</p>
          </div>
        </div>

        {/* Plans */}
        <div className="mb-10">
          <div className="mb-5">
            <h2 className="text-[16px] font-bold mb-1">クレジットを購入</h2>
            <p className="text-[13px] text-muted-foreground">まとめ買いほどお得。有効期限内に使い切ってください。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className="relative bg-card border rounded-2xl p-5 flex flex-col transition-shadow hover:shadow-xl"
                style={{ borderColor: plan.popular ? plan.color + '50' : undefined, boxShadow: plan.popular ? `0 0 0 1px ${plan.color}30` : undefined }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: plan.color, color: '#fff' }}
                  >
                    人気
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: plan.color + '20', color: plan.color }}
                    >
                      {plan.badge}
                    </div>
                    <span className="text-[15px] font-bold">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[30px] font-bold leading-none">{plan.price}</span>
                    <span className="text-[12px] text-muted-foreground">/ 回</span>
                  </div>
                  <p className="text-[12px] font-semibold mt-1.5" style={{ color: plan.color }}>
                    {plan.credits} クレジット
                  </p>
                </div>

                <ul className="flex flex-col gap-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: plan.color + '20' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="3">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full h-10 text-[13px] font-semibold"
                  variant={plan.popular ? 'default' : 'outline'}
                  style={
                    purchased === plan.id
                      ? { backgroundColor: '#10B06B', color: '#fff', borderColor: 'transparent' }
                      : plan.popular
                      ? { backgroundColor: plan.color, color: '#fff' }
                      : {}
                  }
                  disabled={!!purchasing || purchased === plan.id}
                  onClick={() => handlePurchase(plan.id)}
                >
                  {purchased === plan.id ? (
                    <span className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      購入済み
                    </span>
                  ) : purchasing === plan.id ? (
                    <span className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      処理中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      Stripe で支払う
                    </span>
                  )}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Stripe による安全な決済 · クレジットカード / デビットカード対応
          </p>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-[16px] font-bold mb-4">利用履歴</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">日付</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">内容</th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">クレジット</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TRANSACTIONS.map((tx, i) => (
                  <tr key={tx.id} className={i < MOCK_TRANSACTIONS.length - 1 ? 'border-b border-border' : ''}>
                    <td className="text-[12px] text-muted-foreground px-4 py-3 font-mono whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tx.companyId ? (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: (tx.companyColor ?? '#5E55EA') + '25', color: tx.companyColor ?? '#5E55EA' }}
                          >
                            {tx.companyId}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-primary/15 text-primary">
                            購入
                          </span>
                        )}
                        <span className="text-[12px] truncate">{tx.description}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-[13px] font-bold"
                        style={{ color: tx.type === 'purchased' ? '#10B06B' : '#C4CDD9' }}
                      >
                        {tx.type === 'purchased' ? '+' : ''}{tx.amount} cr
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
