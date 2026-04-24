import { useEffect, useState } from 'react';
import { Button } from './ui/button';

type RiskLevel = 'low' | 'medium' | 'high';

interface ApprovalModalProps {
  agentName: string;
  companyId: string;
  companyColor: string;
  tool: string;
  args: Record<string, unknown>;
  riskLevel: RiskLevel;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

const RISK_CFG: Record<RiskLevel, { label: string; color: string; bg: string; desc: string }> = {
  low:    { label: 'LOW RISK',    color: '#267ADE', bg: 'rgba(38,122,222,0.08)',  desc: '情報収集・参照のみ'     },
  medium: { label: 'MEDIUM RISK', color: '#EB9619', bg: 'rgba(235,150,25,0.08)', desc: '内部データの変更を伴う' },
  high:   { label: 'HIGH RISK',   color: '#DA3950', bg: 'rgba(218,57,80,0.08)',  desc: '外部への送信・公開を伴う' },
};

const COUNTDOWN_TOTAL = 30;

export default function ApprovalModal({
  agentName, companyId, companyColor, tool, args, riskLevel,
  onApprove, onReject, onClose,
}: ApprovalModalProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL);
  const risk = RISK_CFG[riskLevel];
  const progress = (countdown / COUNTDOWN_TOTAL) * 100;

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); onReject(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-20 w-[540px] max-w-[95vw] bg-surface border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ borderColor: risk.color + '60' }}
      >
        <div className="h-1" style={{ backgroundColor: risk.color }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ backgroundColor: risk.bg }}>
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{ backgroundColor: companyColor + '20', border: `1.5px solid ${companyColor}50`, color: companyColor }}
            >
              {companyId}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: risk.color + '20', color: risk.color }}
                >
                  {risk.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{risk.desc}</span>
              </div>
              <h2 className="text-[15px] font-bold">{agentName} が承認を要求しています</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                実行前にこのアクションを確認してください
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4 flex flex-col gap-4">
          {/* Tool call */}
          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/30 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EB9619" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-bold font-mono">{tool}</p>
                <p className="text-[11px] text-amber">Tool Call</p>
              </div>
            </div>
            <pre className="text-[11px] font-mono text-[#9B8FFA] bg-background rounded-lg p-3 border border-border overflow-x-auto leading-relaxed">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {/* Countdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">応答しない場合、自動的に拒否されます</span>
              <span
                className="text-[12px] font-bold font-mono tabular-nums"
                style={{ color: countdown <= 10 ? '#DA3950' : '#EB9619' }}
              >
                {countdown}s
              </span>
            </div>
            <div className="h-1.5 bg-card rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, backgroundColor: countdown <= 10 ? '#DA3950' : '#EB9619' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11 text-[13px] font-semibold"
              style={{ borderColor: 'rgba(218,57,80,0.4)', color: '#DA3950' }}
              onClick={onReject}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              拒否
            </Button>
            <Button
              className="flex-1 h-11 text-[13px] font-semibold"
              style={{ backgroundColor: '#10B06B' }}
              onClick={onApprove}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              承認して実行
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
