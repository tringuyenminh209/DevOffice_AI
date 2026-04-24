import { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { audioManager } from '../utils/audioSystem';

interface AIVoiceSummaryProps {
  summary: string;
  duration?: number;
}

export default function AIVoiceSummary({ summary, duration = 15 }: AIVoiceSummaryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const handlePlay = () => {
    if (isPlaying) {
      // Pause
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      audioManager.stopDucking();
      setIsPlaying(false);
    } else {
      // Play
      audioManager.startDucking();
      audioManager.playApprovalPing(); // Simulate voice start

      intervalRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            audioManager.stopDucking();
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);

      setIsPlaying(true);
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    audioManager.setEnabled(isMuted);
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="p-4 bg-card border border-primary rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-11 h-10 rounded bg-primary/15 flex items-center justify-center shrink-0">
          <div className="flex gap-[2px]">
            {[3, 7, 11, 14, 11, 7, 3].map((h, i) => (
              <div
                key={i}
                className={`w-1 transition-all duration-150 ${
                  isPlaying ? 'bg-primary' : 'bg-primary/50'
                }`}
                style={{
                  height: `${h}px`,
                  opacity: isPlaying ? 0.5 + Math.sin(Date.now() / 100 + i) * 0.5 : 0.8
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[12px] font-semibold text-primary">
              AI Voice Summary — {duration} giây
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleMute}
                className="w-6 h-6 rounded hover:bg-primary/10 flex items-center justify-center transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-text-muted" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-text-secondary" />
                )}
              </button>

              <button
                onClick={handlePlay}
                className="w-7 h-7 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 text-white fill-white" />
                ) : (
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                )}
              </button>
            </div>
          </div>

          <div className="text-[10px] text-text-primary leading-relaxed mb-2">
            {summary}
          </div>

          <div className="relative">
            <div className="h-1 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {isPlaying && (
              <div className="absolute right-0 -top-5 text-[9px] text-primary font-mono">
                {currentTime.toFixed(1)}s / {duration}s
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
