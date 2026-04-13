export default function CarouselIndicators({ total, activeIndex, onSelect, isLight }) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border px-2 py-1 backdrop-blur-sm sm:bottom-4">
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-2.5 rounded-full transition-all ${
              isActive
                ? "w-5 bg-amber-400"
                : isLight
                  ? "w-2.5 bg-slate-400/70 hover:bg-slate-500"
                  : "w-2.5 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={isActive ? "true" : "false"}
          />
        );
      })}
    </div>
  );
}
