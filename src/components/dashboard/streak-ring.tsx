const DAYS = 20;
const SIZE = 250;
const RADIUS = 100;
const DOT = 20;

/** v1's streak ring: one dot per day, filled up to the current streak. */
export function StreakRing({ current, best }: { current: number; best: number }) {
  const filled = Math.min(current, DAYS);
  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      {Array.from({ length: DAYS }, (_, i) => {
        // start at the bottom and go clockwise
        const rad = ((360 / DAYS) * i + 90) * (Math.PI / 180);
        const x = SIZE / 2 + RADIUS * Math.cos(rad) - DOT / 2;
        const y = SIZE / 2 + RADIUS * Math.sin(rad) - DOT / 2;
        const isFilled = i < filled;
        const isToday = i === filled - 1;
        const ahead = i - filled;
        return (
          <div
            key={i}
            aria-hidden
            className={`absolute flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${
              isFilled ? "bg-primary text-white" : "bg-muted"
            } ${isToday ? "shadow-primary/70 shadow-[0_0_12px_3px]" : ""}`}
            style={{
              top: y,
              left: x,
              width: DOT,
              height: DOT,
              transform: `scale(${isFilled ? 1 : Math.max(0.5, 1 - ahead * 0.05)})`,
              opacity: isFilled ? 1 : Math.max(0.3, 1 - ahead * 0.1),
            }}
          >
            {isFilled ? "✓" : ""}
          </div>
        );
      })}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-primary text-3xl font-bold">{current}</div>
        <div className="text-muted-foreground text-sm">Current streak</div>
        <div className="text-muted-foreground text-xs">
          Longest streak: <span className="text-amber-500">{best}</span>
        </div>
      </div>
    </div>
  );
}
