import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CarouselControls({ isLight, onPrev, onNext }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between sm:inset-x-3">
      <button
        type="button"
        onClick={onPrev}
        className={`pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition sm:h-10 sm:w-10 ${
          isLight
            ? "border-slate-300 bg-white/95 text-slate-800 hover:bg-white"
            : "border-white/20 bg-[#0b1728]/85 text-slate-100 hover:bg-[#12233b]"
        }`}
        aria-label="Previous banner"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        onClick={onNext}
        className={`pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition sm:h-10 sm:w-10 ${
          isLight
            ? "border-slate-300 bg-white/95 text-slate-800 hover:bg-white"
            : "border-white/20 bg-[#0b1728]/85 text-slate-100 hover:bg-[#12233b]"
        }`}
        aria-label="Next banner"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
