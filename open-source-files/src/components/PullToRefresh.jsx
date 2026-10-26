import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      active.current = true;
    } else {
      active.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!active.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, THRESHOLD * 1.6));
    }
  };

  const onTouchEnd = async () => {
    if (!active.current) return;
    active.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {(pull > 0 || refreshing) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none flex items-center justify-center"
          style={{ top: pull - 28 }}
        >
          <Loader2
            className={`w-5 h-5 text-brand-soft ${refreshing ? "animate-spin" : ""}`}
            style={refreshing ? {} : { transform: `rotate(${pull * 3}deg)` }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
