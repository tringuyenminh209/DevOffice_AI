import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { audioManager } from '../utils/audioSystem';
import { hapticManager } from '../utils/hapticFeedback';

export default function ApprovalModal({ onClose, onApprove, onReject }: {
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [countdown, setCountdown] = useState(165); // 2:45 in seconds
  const [hologramRotation, setHologramRotation] = useState(0);

  useEffect(() => {
    audioManager.playApprovalPing();

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(countdownInterval);
          handleAutoReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const rotationInterval = setInterval(() => {
      setHologramRotation(prev => (prev + 2) % 360);
    }, 50);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(rotationInterval);
    };
  }, []);

  const handleAutoReject = () => {
    audioManager.playErrorBuzz();
    onReject();
  };

  const handleApproveClick = () => {
    audioManager.playSuccessChord();
    hapticManager.approval();
    onApprove();
  };

  const handleRejectClick = () => {
    audioManager.playErrorBuzz();
    hapticManager.error();
    onReject();
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const progress = (countdown / 165) * 100;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute top-6 right-6 z-10">
        <div className="w-[170px] bg-surface border border-border rounded-[10px] p-3">
          <div className="text-[9px] font-semibold text-text-secondary mb-2 tracking-wide">
            RISK LEVELS
          </div>

          <div className="space-y-2">
            {[
              { level: 'LOW', color: '#267ADE', desc: 'Informational tasks' },
              { level: 'MEDIUM', color: '#EB9619', desc: 'Internal updates' },
              { level: 'HIGH', color: '#DA3950', desc: 'External actions' }
            ].map((risk, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 mt-0.5 rounded-sm shrink-0" style={{ backgroundColor: risk.color }} />
                <div>
                  <div className="text-[10px] font-bold" style={{ color: risk.color }}>
                    {risk.level}
                  </div>
                  <div className="text-[8px] text-text-secondary leading-tight">{risk.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 w-[600px] max-w-[95vw] bg-surface border-2 border-crimson rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-crimson animate-pulse" />

        <div className="relative pt-8 pb-6 px-8" style={{ backgroundColor: 'rgba(218, 57, 80, 0.04)' }}>
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-4">
              <div className="w-[72px] h-[72px] rounded-full bg-gold/15 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gold/25 flex items-center justify-center border-2 border-gold/30">
                  <div className="text-[18px] font-bold text-gold">AN</div>
                </div>
              </div>

              <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 mb-1 transition-all duration-300"
                    style={{
                      height: `${[5, 12, 18][i]}px`,
                      backgroundColor: '#EB9619',
                      opacity: 0.5 + Math.sin(Date.now() / 200 + i) * 0.3
                    }}
                  />
                ))}
              </div>

              <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 mb-1 transition-all duration-300"
                    style={{
                      height: `${[18, 12, 5][i]}px`,
                      backgroundColor: '#EB9619',
                      opacity: 0.5 + Math.sin(Date.now() / 200 + i + 1) * 0.3
                    }}
                  />
                ))}
              </div>

              <div className="absolute inset-[-8px] rounded-full" style={{ transform: `rotate(${hologramRotation}deg)` }}>
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 15);
                  const rad = (angle * Math.PI) / 180;
                  const r = 32;
                  const x = Math.cos(rad) * r;
                  const y = Math.sin(rad) * r;
                  const isVisible = i % 2 === 0;

                  return isVisible ? (
                    <div
                      key={i}
                      className="absolute w-0.5 h-2 bg-amber/60 transition-opacity duration-150"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                        opacity: 0.4 + Math.sin((Date.now() / 100) + i * 0.5) * 0.4
                      }}
                    />
                  ) : null;
                })}
              </div>
            </div>

            <h2 className="text-[20px] font-bold mb-1">Analyst đang chờ phê duyệt</h2>
            <p className="text-[12px] text-text-secondary">
              Tool call yêu cầu xác nhận từ người quản lý
            </p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="p-3 bg-crimson/8 border-[1.5px] border-crimson rounded-[10px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-crimson/15 flex items-center justify-center shrink-0">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-1 h-3.5 bg-crimson rounded-full" />
                  <div className="w-1.5 h-1.5 bg-crimson rounded-full" />
                </div>
              </div>

              <div className="flex-1">
                <div className="text-[13px] font-bold text-crimson mb-0.5">
                  RỦI RO CAO
                </div>
                <div className="text-[10px] text-crimson">
                  Hành động này sẽ tác động đến bên ngoài tổ chức
                </div>
              </div>

              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2.5 h-[22px] bg-crimson rounded-sm" />
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border-[1.5px] border-amber rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded bg-amber/15 flex items-center justify-center">
                <div className="w-7 h-5 border-[1.5px] border-amber rounded-sm relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 border-[1.5px] border-amber border-b-0 rounded-t-sm" />
                </div>
              </div>

              <div>
                <div className="text-[16px] font-bold">send_email</div>
                <div className="text-[11px] text-amber">External Communication Tool</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#071826] border border-sapphire rounded-lg">
            <div className="flex gap-2">
              <div className="w-[3px] bg-sapphire rounded-full shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-sapphire mb-1">
                  Ngôn ngữ dành cho CEO
                </div>
                <div className="text-[11px] text-text-primary">
                  "Sẽ gửi email thông báo kết quả phân tích đến 247 khách hàng VIP. Email được cá nhân hóa dựa trên lịch sử mua hàng."
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#070B0D] border border-border rounded-lg">
            <pre className="text-[10px] font-mono text-[#10D062] leading-relaxed overflow-x-auto">
{`{
  "to": "vip_customers@list",
  "subject": "Kết quả phân tích Q2",
  "body": "{{personalized_content}}",
  "attachments": ["q2_report.pdf"]
}`}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-text-secondary">Tự động từ chối sau</div>
              <div className={`text-[10px] font-semibold ${countdown < 30 ? 'text-crimson animate-pulse' : 'text-amber'}`}>
                {timeString}
              </div>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-amber rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12 border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20 hover:scale-105 font-semibold text-[15px] transition-all active:scale-95"
              onClick={handleRejectClick}
            >
              <div className="mr-2">
                <div className="relative w-4 h-4">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-current rotate-45" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-current -rotate-45" />
                </div>
              </div>
              Từ chối
            </Button>

            <Button
              className="flex-1 h-12 bg-emerald hover:bg-emerald/90 hover:scale-105 font-semibold text-[15px] transition-all active:scale-95"
              onClick={handleApproveClick}
            >
              <div className="mr-2">
                <div className="relative w-4 h-4">
                  <div className="absolute bottom-0 left-0 w-2 h-0.5 bg-current rotate-[-45deg] origin-left" />
                  <div className="absolute bottom-0 left-1.5 w-3 h-0.5 bg-current rotate-45 origin-left" />
                </div>
              </div>
              Phê duyệt & Gửi đi
            </Button>
          </div>

          <div className="text-center">
            <div className="text-[9px] text-text-muted">
              Rung xác nhận trên thiết bị di động
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
