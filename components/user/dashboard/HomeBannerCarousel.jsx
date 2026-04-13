import { useEffect, useMemo, useState } from "react";
import BannerSlide from "@/components/user/dashboard/BannerSlide";
import CarouselControls from "@/components/user/dashboard/CarouselControls";
import CarouselIndicators from "@/components/user/dashboard/CarouselIndicators";

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 45;

export default function HomeBannerCarousel({ slides, isLight }) {
  const bannerSlides = useMemo(() => (Array.isArray(slides) ? slides.filter((slide) => slide?.id) : []), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const totalSlides = bannerSlides.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((index) => (index + 1) % totalSlides);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  const nextSlide = () => {
    if (totalSlides <= 1) return;
    setActiveIndex((index) => (index + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (totalSlides <= 1) return;
    setActiveIndex((index) => (index - 1 + totalSlides) % totalSlides);
  };

  const onTouchStart = (event) => {
    setTouchStartX(event.touches?.[0]?.clientX ?? null);
  };

  const onTouchEnd = (event) => {
    if (touchStartX === null || totalSlides <= 1) return;
    const endX = event.changedTouches?.[0]?.clientX ?? touchStartX;
    const delta = touchStartX - endX;

    if (delta > SWIPE_THRESHOLD) nextSlide();
    if (delta < -SWIPE_THRESHOLD) prevSlide();

    setTouchStartX(null);
  };

  const markImageError = (slideId) => {
    setImageErrors((prev) => ({ ...prev, [slideId]: true }));
  };

  if (totalSlides === 0) {
    return (
      <section className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"}`}>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Featured banners will appear here soon.</p>
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border shadow-[0_10px_28px_rgba(2,10,23,0.24)] ${
        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1d32]"
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Featured announcements"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {bannerSlides.map((slide) => (
          <BannerSlide
            key={slide.id}
            slide={slide}
            hasImageError={Boolean(imageErrors[slide.id])}
            onImageError={markImageError}
            isLight={isLight}
          />
        ))}
      </div>

      {totalSlides > 1 ? (
        <>
          <CarouselControls isLight={isLight} onPrev={prevSlide} onNext={nextSlide} />
          <CarouselIndicators
            total={totalSlides}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            isLight={isLight}
          />
        </>
      ) : null}
    </section>
  );
}
