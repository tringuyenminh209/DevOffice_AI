import { useState } from 'react';
import { Button } from './ui/button';

const steps = [
  {
    title: 'Giải mã Pixel',
    subtitle: 'Hiểu ý nghĩa màu sắc của các Agent',
    content: (
      <div className="space-y-4">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Mỗi Agent có màu sắc riêng để dễ nhận biết trong văn phòng ảo:
        </p>

        <div className="space-y-3">
          {[
            { id: 'RS', name: 'Researcher', color: '#267ADE', role: 'Nghiên cứu & Tìm kiếm' },
            { id: 'AN', name: 'Analyst', color: '#E5BA2E', role: 'Phân tích dữ liệu' },
            { id: 'WR', name: 'Writer', color: '#228B22', role: 'Viết nội dung' },
            { id: 'RV', name: 'Reviewer', color: '#5E55EA', role: 'Kiểm tra chất lượng' },
            { id: 'DV', name: 'Developer', color: '#36454F', role: 'Lập trình & Tối ưu' }
          ].map(agent => (
            <div key={agent.id} className="flex items-center gap-3 p-2 bg-card rounded-lg">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{
                  backgroundColor: `${agent.color}15`,
                  color: agent.color
                }}
              >
                {agent.id}
              </div>
              <div>
                <div className="text-[12px] font-semibold">{agent.name}</div>
                <div className="text-[10px] text-text-secondary">{agent.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'Cơ chế Phê duyệt',
    subtitle: 'Làm quen với nút "Approve"',
    content: (
      <div className="space-y-4">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Khi Agent thực hiện hành động rủi ro cao (gửi email, thanh toán), bạn sẽ nhận thông báo để phê duyệt.
        </p>

        <div className="p-4 bg-card border border-amber rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-1 h-3 bg-amber rounded-full" />
                <div className="w-1.5 h-1.5 bg-amber rounded-full" />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber">Yêu cầu phê duyệt</div>
              <div className="text-[9px] text-text-secondary">Analyst muốn gửi email</div>
            </div>
          </div>

          <div className="text-[10px] text-text-secondary mb-3">
            "Sẽ gửi email thông báo kết quả phân tích đến 247 khách hàng VIP"
          </div>

          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-crimson/10 border border-crimson rounded flex items-center justify-center text-[11px] font-semibold text-crimson">
              Từ chối
            </div>
            <div className="flex-1 h-8 bg-emerald border-0 rounded flex items-center justify-center text-[11px] font-semibold text-white">
              Phê duyệt
            </div>
          </div>
        </div>

        <div className="p-3 bg-sapphire/8 border border-sapphire/30 rounded-lg">
          <div className="text-[10px] text-sapphire font-semibold mb-1">💡 Mẹo</div>
          <div className="text-[10px] text-text-secondary">
            Màu đỏ = Rủi ro cao · Màu vàng = Rủi ro trung bình · Màu xanh = Thông tin
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Chuyển đổi View',
    subtitle: 'Gạt nút Manager ↔ Dev Mode',
    content: (
      <div className="space-y-4">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          DevOffice AI có 2 chế độ xem dành cho vai trò khác nhau:
        </p>

        <div className="space-y-3">
          <div className="p-4 bg-card border border-primary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-[10px] font-bold">
                M
              </div>
              <div className="text-[12px] font-semibold">Manager Mode</div>
            </div>
            <div className="text-[10px] text-text-secondary leading-relaxed">
              • Văn phòng ảo 2D trực quan<br />
              • Ngôn ngữ kinh doanh dễ hiểu<br />
              • Tập trung vào kết quả và ROI
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-charcoal rounded flex items-center justify-center text-[10px] font-bold">
                D
              </div>
              <div className="text-[12px] font-semibold">Dev Mode</div>
            </div>
            <div className="text-[10px] text-text-secondary leading-relaxed">
              • Event trace timeline chi tiết<br />
              • Raw JSON payload và logs<br />
              • Token usage và call stack
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="inline-flex items-center h-8 bg-card rounded-lg border border-border p-0.5">
            <div className="px-4 h-full bg-primary text-primary-foreground rounded-md flex items-center text-[13px] font-semibold">
              Manager
            </div>
            <div className="px-4 h-full text-text-secondary flex items-center text-[13px] font-semibold">
              Dev
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="w-[560px] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-background">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <div className="text-[28px] font-bold text-primary">
                {currentStep + 1}
              </div>
            </div>

            <h2 className="text-[20px] font-bold mb-2">{step.title}</h2>
            <p className="text-[13px] text-text-secondary">{step.subtitle}</p>
          </div>

          <div className="mb-8">
            {step.content}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-[12px] text-text-secondary hover:text-foreground"
            >
              Bỏ qua hướng dẫn
            </button>

            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentStep ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="ml-4 bg-primary hover:bg-primary/90"
              >
                {currentStep < steps.length - 1 ? 'Tiếp theo' : 'Bắt đầu'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
