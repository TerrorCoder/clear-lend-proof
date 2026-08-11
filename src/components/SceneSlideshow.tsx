import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import district from "@/assets/scene-district.jpg";
import documents from "@/assets/scene-documents.jpg";
import shield from "@/assets/scene-shield.jpg";
import cloud1 from "@/assets/cloud-1.jpg";

const scenes = [
  { src: district, alt: "Financial district towers rising through low fog" },
  { src: documents, alt: "Loan documents on a desk in soft grey window light" },
  { src: shield, alt: "Layered frosted glass suggesting shielded data" },
  { src: cloud1, alt: "Overcast clouds above a calm horizon" },
];

/**
 * Full-bleed crossfading slideshow used as a section background.
 * Content is rendered above it via children of the parent section.
 */
export function SceneSlideshow({
  className,
  interval = 6000,
  opacity = "opacity-30",
}: {
  className?: string;
  interval?: number;
  opacity?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % scenes.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [interval]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {scenes.map((s, i) => (
        <img
          key={s.alt}
          src={s.src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          width={1600}
          height={900}
          className={cn(
            "animate-ken-burns absolute inset-0 size-full object-cover grayscale transition-opacity duration-[2400ms] ease-in-out",
            i === index ? opacity : "opacity-0",
          )}
        />
      ))}
      <div className="fog-mask absolute inset-0" />
    </div>
  );
}
