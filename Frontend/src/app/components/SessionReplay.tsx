import { useState } from 'react';
import VirtualOfficeCanvas from './VirtualOfficeCanvasV2';
import AIVoiceSummary from './AIVoiceSummary';
import ROIChart from './ROIChart';
import BudgetForecast from './BudgetForecast';
import { generateReplayQRCode } from '../utils/qrGenerator';

const sessions = [
  { id: 'sess_9k2m4n', name: 'Marketing Q2 Analysis', time: '14:36:42', cost: '$0.0342', status: 'success' },
  { id: 'sess_7h3k9p', name: 'Customer Data Review', time: '12:24:18', cost: '$0.0189', status: 'success' },
  { id: 'sess_2m8n4q', name: 'Product Launch Draft', time: '08:45:33', cost: '$0.0421', status: 'failed' }
];

const speeds = ['1×', '2×', '5×', '10×'];

export default function SessionReplay({ onViewChange }: { onViewChange: (view: 'manager' | 'dev') => void }) {
  const [selectedSession, setSelectedSession] = useState(sessions[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('10×');
  const [qrCode, setQrCode] = useState<string>('');

  const handleExportPDF = async () => {
    const qr = await generateReplayQRCode(selectedSession);
    setQrCode(qr);
    alert('PDF export feature sẽ được implement với jsPDF library');
  };

  return (
    <div className="h-screen bg-background dark flex flex-col">
      <div className="h-14 bg-surface border-b border-border-subtle flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-[14px]">
              D
            </div>
            <span className="font-bold text-[15px]">DevOffice AI</span>
          </div>
          <span className="text-[10px] text-text-secondary">Session Replay</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber/12 border border-amber rounded px-3 py-1.5">
            <div className="flex gap-1">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-amber" />
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-amber" />
            </div>
            <span className="text-[11px] font-semibold text-amber">REPLAY ×10</span>
          </div>

          <div className="flex items-center h-8 bg-card rounded-lg border border-border p-0.5">
            <button
              className="px-4 h-full text-[13px] font-semibold text-text-secondary hover:text-foreground"
              onClick={() => onViewChange('manager')}
            >
              Manager
            </button>
            <button
              className="px-4 h-full text-[13px] font-semibold text-text-secondary hover:text-foreground"
              onClick={() => onViewChange('dev')}
            >
              Dev
            </button>
          </div>

          <div className="flex items-center gap-2 h-8 px-3 bg-card rounded-lg border border-border cursor-pointer hover:border-border-subtle">
            <div className="flex gap-0.5">
              {[3, 7, 11, 14, 11, 7, 3].map((h, i) => (
                <div key={i} className="w-1" style={{ height: `${h}px`, backgroundColor: '#5E55EA' }} />
              ))}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-bold">
            CEO
          </div>
        </div>
      </div>

      <div className="h-12 bg-surface border-b border-border-subtle px-6 flex items-center gap-3">
        {sessions.map(session => {
          const isActive = selectedSession === session.id;

          return (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session.id)}
              className={`h-[38px] px-4 rounded-lg border transition-all ${
                isActive
                  ? 'bg-primary/15 border-primary/50'
                  : 'bg-surface border-border hover:border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    session.status === 'success' ? 'bg-emerald' : 'bg-crimson'
                  }`}
                />
                <div className="text-left">
                  <div className="text-[12px] font-semibold">{session.name}</div>
                  <div className="text-[9px] text-text-muted">{session.time} · {session.cost}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 mb-6 opacity-60">
            <VirtualOfficeCanvas />
          </div>

          <div className="space-y-4">
            <div className="h-[60px] bg-surface border border-border-subtle rounded-lg px-6 flex items-center gap-4">
              <button className="w-[38px] h-[38px] bg-card border border-border rounded-lg flex items-center justify-center hover:bg-card/80">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-4 bg-foreground" />
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-foreground" />
                </div>
              </button>

              <button className="w-[38px] h-[38px] bg-card border border-border rounded-lg flex items-center justify-center hover:bg-card/80">
                <div className="flex gap-0.5">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-foreground" />
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-foreground" />
                </div>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-[38px] h-[38px] bg-card border border-border rounded-lg flex items-center justify-center hover:bg-card/80"
              >
                {isPlaying ? (
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-foreground" />
                    <div className="w-1 h-4 bg-foreground" />
                  </div>
                ) : (
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-foreground ml-1" />
                )}
              </button>

              <button className="w-[38px] h-[38px] bg-card border border-border rounded-lg flex items-center justify-center hover:bg-card/80">
                <div className="flex gap-0.5">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-foreground" />
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-foreground" />
                </div>
              </button>

              <button className="w-[38px] h-[38px] bg-card border border-border rounded-lg flex items-center justify-center hover:bg-card/80">
                <div className="flex gap-0.5">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-foreground" />
                  <div className="w-0.5 h-4 bg-foreground" />
                </div>
              </button>

              <div className="flex gap-2 ml-4">
                {speeds.map(s => {
                  const isActive = speed === s;

                  return (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-3 py-1 rounded text-[11px] font-medium ${
                        isActive
                          ? 'bg-amber text-black'
                          : 'bg-card border border-border text-text-secondary hover:text-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 flex items-center gap-4 ml-6">
                <div className="text-[18px] font-bold">14:32:07</div>
                <div className="text-[10px] text-text-secondary">/ 14:36:42</div>

                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/12" style={{ width: '62%' }} />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" style={{ marginLeft: '-18px' }} />
                </div>
              </div>
            </div>

            <div className="h-20 bg-surface border border-border-subtle rounded-lg px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] font-semibold text-text-secondary tracking-wide">
                  TIMELINE
                </div>
                <div className="text-[9px] text-amber">
                  Mốc vàng = Approval Gate
                </div>
              </div>

              <div className="relative h-9 bg-background rounded-md border border-border overflow-hidden">
                <div className="absolute inset-0 bg-primary/12" style={{ width: '62%' }} />

                {[
                  { pos: 28, type: 'approval' },
                  { pos: 42, type: 'error' },
                  { pos: 55, type: 'approval' },
                  { pos: 78, type: 'approval' }
                ].map((marker, i) => (
                  <div
                    key={i}
                    className={`absolute top-1 bottom-1 w-1 rounded-full ${
                      marker.type === 'approval' ? 'bg-amber' : 'bg-crimson'
                    }`}
                    style={{ left: `${marker.pos}%` }}
                  />
                ))}

                {[12, 22, 35, 48, 61, 70, 82, 92].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary"
                    style={{ left: `${pos}%` }}
                  />
                ))}

                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full"
                  style={{ left: '62%', transform: 'translateX(-50%)' }}
                />
                <div
                  className="absolute -top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-background"
                  style={{ left: '62%', transform: 'translateX(-50%)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-[640px] bg-surface border-l border-border-subtle p-6 overflow-y-auto space-y-6">
          <AIVoiceSummary
            summary="Chào sếp, phiên này tập trung soạn thảo Marketing Q2. Đã có 2 yêu cầu rủi ro cao được duyệt trong 5 phút. Tiết kiệm 4 giờ làm việc. Chi phí 1.24 USD."
            duration={15}
          />

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Thời gian', value: '14:36', unit: 'minutes' },
              { label: 'Chi phí', value: '$0.03', color: '#EB9619' },
              { label: 'Sự kiện', value: '47', unit: 'events' },
              { label: 'Phê duyệt', value: '2', color: '#DA3950' },
              { label: 'Tiết kiệm', value: '4h', color: '#10B06B' },
              { label: 'ROI ước tính', value: '24×', color: '#5E55EA' }
            ].map((stat, i) => (
              <div key={i} className="p-3 bg-card border border-border rounded-lg">
                <div className="text-[10px] text-text-secondary mb-1">{stat.label}</div>
                <div className="text-[18px] font-bold" style={{ color: stat.color || '#EAEDEC' }}>
                  {stat.value}
                </div>
                {stat.unit && (
                  <div className="text-[9px] text-text-muted">{stat.unit}</div>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold text-text-secondary mb-3 tracking-wide">
              AGENT PERFORMANCE
            </div>

            <div className="space-y-3">
              {[
                { id: 'RS', name: 'Researcher', color: '#267ADE', events: 12, cost: '$0.0089' },
                { id: 'AN', name: 'Analyst', color: '#E5BA2E', events: 8, cost: '$0.0124' },
                { id: 'WR', name: 'Writer', color: '#228B22', events: 11, cost: '$0.0067' },
                { id: 'RV', name: 'Reviewer', color: '#5E55EA', events: 9, cost: '$0.0038' },
                { id: 'DV', name: 'Developer', color: '#36454F', events: 7, cost: '$0.0024' }
              ].map(agent => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: `${agent.color}15`,
                      color: agent.color
                    }}
                  >
                    {agent.id}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[11px] font-medium">{agent.name}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] text-text-muted">{agent.events} events</div>
                        <div className="text-[10px] font-medium text-amber">{agent.cost}</div>
                      </div>
                    </div>

                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: agent.color,
                          opacity: 0.7,
                          width: `${(agent.events / 12) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-card border border-primary rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-primary/15 flex items-center justify-center shrink-0">
                <div className="relative">
                  <div className="w-1 h-7 bg-primary" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-1 bg-primary" />
                </div>
              </div>

              <div className="flex-1">
                <div className="text-[12px] font-semibold mb-1">AI Insights</div>
                <div className="text-[10px] text-text-secondary leading-relaxed">
                  2 approval gates xuất hiện trong 5 phút đầu — cao hơn 40% so với phiên trung bình. Analyst và Researcher thường cần phê duyệt khi truy cập dữ liệu bên ngoài.
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            className="w-full h-12 bg-primary/12 border-[1.5px] border-primary rounded-lg text-[14px] font-semibold text-primary hover:bg-primary/20 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Xuất báo cáo PDF cho Hội đồng Quản trị
            <div className="flex items-center">
              <div className="w-1 h-5 bg-current" />
              <div className="w-0 h-0 border-l-[6px] border-l-current border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent" />
            </div>
          </button>

          <div className="grid grid-cols-1 gap-4">
            <ROIChart />
            <BudgetForecast />
          </div>

          <div className="text-center text-[10px] text-text-muted">
            QR code sẽ có trong file PDF để mở Replay trên thiết bị di động
          </div>
        </div>
      </div>
    </div>
  );
}
