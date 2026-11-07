/**
 * Soft beams of light falling from above the hero, slowly swaying like sunlight through haze.
 * Pure CSS (see .light-ray in globals.css); still for people who prefer reduced motion.
 */
const RAYS = [
  { left: "18%", width: "9rem", rotate: "16deg", delay: "0s", duration: "14s" },
  { left: "32%", width: "5rem", rotate: "9deg", delay: "-4s", duration: "11s" },
  { left: "46%", width: "12rem", rotate: "2deg", delay: "-8s", duration: "16s" },
  { left: "60%", width: "6rem", rotate: "-8deg", delay: "-2s", duration: "12s" },
  { left: "72%", width: "10rem", rotate: "-15deg", delay: "-6s", duration: "15s" },
];

export function LightRays() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-24 h-[46rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
    >
      {RAYS.map((r) => (
        <span
          key={r.left}
          className="light-ray"
          style={
            {
              left: r.left,
              width: r.width,
              "--ray-rotate": r.rotate,
              animationDelay: r.delay,
              animationDuration: r.duration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
