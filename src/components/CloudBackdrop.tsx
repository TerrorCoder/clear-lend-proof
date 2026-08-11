import cloud1 from "@/assets/cloud-1.jpg";
import cloud3 from "@/assets/cloud-3.jpg";

/**
 * Fixed, slowly drifting cloud layers behind all page content.
 */
export function CloudBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="animate-drift absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${cloud3})` }}
      />
      <div
        className="animate-drift-alt absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity"
        style={{ backgroundImage: `url(${cloud1})` }}
      />
      <div className="fog-mask absolute inset-0" />
    </div>
  );
}
