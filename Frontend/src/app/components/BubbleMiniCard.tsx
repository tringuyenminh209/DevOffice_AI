import { X } from 'lucide-react';

interface BubbleMiniCardProps {
  tool: string;
  cost: string;
  confidence: string;
  details: string;
  onClose: () => void;
}

export default function BubbleMiniCard({ tool, cost, confidence, details, onClose }: BubbleMiniCardProps) {
  return (
    <div className="absolute z-50 w-[280px] bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] font-semibold text-primary mb-0.5">CHI TIẾT CÔNG CỤ</div>
          <div className="text-[13px] font-bold">{tool}</div>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full hover:bg-border flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-3 bg-card rounded-lg border border-border-inner">
          <span className="text-[10px] text-text-secondary">Chi phí</span>
          <span className="text-[12px] font-bold text-amber">{cost}</span>
        </div>

        <div className="flex items-center justify-between py-2 px-3 bg-card rounded-lg border border-border-inner">
          <span className="text-[10px] text-text-secondary">Độ tin cậy</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`w-1 h-3 rounded-full ${
                    i < parseInt(confidence) ? 'bg-emerald' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-emerald">{confidence}/5</span>
          </div>
        </div>

        <div className="p-3 bg-card rounded-lg border border-border-inner">
          <div className="text-[9px] text-text-secondary mb-1.5 uppercase tracking-wide">
            Mô tả
          </div>
          <div className="text-[10px] text-text-primary leading-relaxed">
            {details}
          </div>
        </div>

        <div className="pt-2 border-t border-border-inner">
          <div className="text-[8px] text-text-muted">
            Click bên ngoài để đóng
          </div>
        </div>
      </div>
    </div>
  );
}
