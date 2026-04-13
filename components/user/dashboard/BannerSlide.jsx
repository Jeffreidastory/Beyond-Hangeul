export default function BannerSlide({ slide, hasImageError, onImageError, isLight }) {
  const imageSrc =
    typeof slide?.image === "string" ? slide.image : slide?.image?.src || "";
  const hasImage = Boolean(imageSrc) && !hasImageError;
  const imageWidth = typeof slide?.image === "object" ? slide?.image?.width : null;
  const imageHeight = typeof slide?.image === "object" ? slide?.image?.height : null;
  const aspectRatio = imageWidth && imageHeight ? `${imageWidth} / ${imageHeight}` : "21 / 10";

  return (
    <article
      className={`relative w-full shrink-0 overflow-hidden rounded-2xl border ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0b1728]"}`}
      style={{ aspectRatio }}
    >
      {hasImage ? (
        <img
          src={imageSrc}
          alt={slide.alt || "Dashboard banner"}
          className="absolute inset-0 h-full w-full object-contain object-center"
          onError={() => onImageError(slide.id)}
          loading="lazy"
        />
      ) : (
        <div className={`absolute inset-0 ${isLight ? "bg-linear-to-r from-slate-100 via-slate-50 to-amber-50" : "bg-linear-to-r from-[#12243d] via-[#173153] to-[#26446d]"}`} />
      )}
    </article>
  );
}
