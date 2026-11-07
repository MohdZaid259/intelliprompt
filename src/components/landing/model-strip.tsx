import { ProviderIcon } from "@/components/provider-icon";
import { MODELS, PROVIDERS } from "@/config/models";

// only providers we actually offer (not the "coming soon" ones)
const LIVE = PROVIDERS.filter((p) => !p.comingSoon && MODELS.some((m) => m.provider === p.name));

/** A moving strip of the model providers you can test against. */
export function ModelStrip() {
  return (
    <section className="px-4 pb-8" aria-label="Supported model providers">
      <p className="text-center text-sm text-purple-100/50">
        Test your prompts on {MODELS.length} models from {LIVE.length} leading AI labs
      </p>
      <div className="mt-6 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        {/* rendered twice for a seamless loop; the copy is hidden from screen readers */}
        <ul className="animate-marquee-left flex shrink-0 items-center gap-14 pr-14 [animation-duration:35s]">
          {[...LIVE, ...LIVE].map((p, i) => (
            <li
              key={`${p.name}-${i}`}
              aria-hidden={i >= LIVE.length}
              className="flex items-center gap-3 text-2xl font-semibold whitespace-nowrap text-white/60"
            >
              <ProviderIcon provider={p.name} className="size-7" />
              {p.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
