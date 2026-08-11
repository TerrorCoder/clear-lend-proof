import cloud1 from "@/assets/cloud-1.jpg";
import cloud2 from "@/assets/cloud-2.jpg";
import cloud3 from "@/assets/cloud-3.jpg";
import cloud4 from "@/assets/cloud-4.jpg";
import { cn } from "@/lib/utils";

const slides = [
  { src: cloud3, alt: "Grey cloudscape seen from above the clouds" },
  { src: cloud4, alt: "Fog drifting across a glass office tower" },
  { src: cloud1, alt: "Overcast storm clouds above a calm grey sea" },
  { src: cloud2, alt: "Layers of mist across a concrete facade" },
];

export function ImageMarquee({
  fast = false,
  className,
}: {
  fast?: boolean;
  className?: string;
}) {
  const track = [...slides, ...slides];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className={cn("flex w-max gap-4", fast ? "animate-marquee-fast" : "animate-marquee")}>
        {track.map((s, i) => (
          <figure
            key={`${s.alt}-${i}`}
            className="relative h-40 w-72 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted sm:h-48 sm:w-96"
          >
            <img
              src={s.src}
              alt={s.alt}
              loading="lazy"
              width={1600}
              height={900}
              className="animate-ken-burns size-full object-cover opacity-90 grayscale"
            />
          </figure>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
