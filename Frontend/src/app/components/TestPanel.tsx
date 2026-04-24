import { useState } from 'react';
import { Button } from './ui/button';
import { wsManager } from '../utils/websocketMock';
import { audioManager } from '../utils/audioSystem';
import { hapticManager } from '../utils/hapticFeedback';

export default function TestPanel() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <span className="text-[20px]">🧪</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] bg-surface border border-border rounded-xl shadow-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold">Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="w-6 h-6 rounded hover:bg-border flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-text-secondary mb-2 uppercase tracking-wide">
            Audio Tests
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => audioManager.playApprovalPing()}
              className="text-[11px]"
            >
              Approval Ping
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => audioManager.playSuccessChord()}
              className="text-[11px]"
            >
              Success Chord
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => audioManager.playErrorBuzz()}
              className="text-[11px]"
            >
              Error Buzz
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => audioManager.playFootstep()}
              className="text-[11px]"
            >
              Footstep
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-[10px] text-text-secondary mb-2 uppercase tracking-wide">
            Haptic Tests
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticManager.light()}
              className="text-[11px]"
            >
              Light
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticManager.medium()}
              className="text-[11px]"
            >
              Medium
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticManager.approval()}
              className="text-[11px]"
            >
              Approval
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticManager.error()}
              className="text-[11px]"
            >
              Error
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-[10px] text-text-secondary mb-2 uppercase tracking-wide">
            WebSocket Events
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              wsManager['generateRandomEvent']();
            }}
            className="w-full text-[11px]"
          >
            Trigger Random Event
          </Button>
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-[10px] text-text-secondary mb-2 uppercase tracking-wide">
            LocalStorage
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              localStorage.removeItem('devoffice_onboarding_complete');
              alert('Onboarding reset! Refresh to see tutorial again.');
            }}
            className="w-full text-[11px]"
          >
            Reset Onboarding
          </Button>
        </div>
      </div>
    </div>
  );
}
