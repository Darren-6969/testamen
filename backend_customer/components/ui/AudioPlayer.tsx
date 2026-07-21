// components/ui/AudioPlayer.tsx
// Reusable "style B" audio player: a pink play/pause button, a draggable
// scrubber, and current/total time. Presentational and app-agnostic -- it only
// knows a `src`, so it's shared by the Admin main-page BGM preview and (later)
// the public memorial page's background music.
'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const ACCENT = '#c3195d';

interface AudioPlayerProps {
  /** Track URL. When it changes, playback resets to the start. */
  src: string;
  /** Optional layout overrides for the outer container. */
  className?: string;
  /** Loop playback -- off for previews, usually on for background music. */
  loop?: boolean;
  /** Fired when the track finishes (does not fire while looping). */
  onEnded?: () => void;
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayer({ src, className, loop = false, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  // When the source changes, stop and reset so the previous track can't keep
  // playing under a new selection.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    a.load(); // preload="none" -> only fetches metadata/audio on demand
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => setPlaying(false)); // autoplay/gesture guards
    } else {
      a.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const t = Number(e.target.value);
    a.currentTime = t;
    setCurrent(t);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 ${className || ''}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white transition-transform active:scale-95"
        style={{ backgroundColor: ACCENT }}
      >
        {playing ? <Pause className="h-[18px] w-[18px]" /> : <Play className="ml-0.5 h-[18px] w-[18px]" />}
      </button>

      <span className="flex-none text-xs tabular-nums text-gray-500">{fmt(current)}</span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={current}
        onChange={seek}
        aria-label="Seek"
        className="bgm-range h-1 flex-1 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, ${ACCENT} 0%, ${ACCENT} ${pct}%, #f4c0d1 ${pct}%, #f4c0d1 100%)`,
        }}
      />

      <span className="flex-none text-xs tabular-nums text-gray-400">{fmt(duration)}</span>

      <audio
        ref={audioRef}
        src={src}
        preload="none"
        loop={loop}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />

      {/* Range thumb styling (Tailwind can't target ::-webkit-slider-thumb). */}
      <style jsx>{`
        .bgm-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 9999px;
          background: ${ACCENT};
          cursor: pointer;
        }
        .bgm-range::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border: none;
          border-radius: 9999px;
          background: ${ACCENT};
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}