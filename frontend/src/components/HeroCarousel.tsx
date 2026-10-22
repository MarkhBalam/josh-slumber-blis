"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = {
  id: number;
  title: string;
  image_path: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const API_URL = "http://127.0.0.1:8000";
const ROTATION_TIME = 3000;

function getSlideImage(slide: HeroSlide) {
  return `${API_URL}/storage/${slide.image_path}`;
}

export default function HeroCarousel({
  slides,
}: {
  slides: HeroSlide[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Automatic Rotation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((current) =>
        current === slides.length - 1
          ? 0
          : current + 1
      );
    }, ROTATION_TIME);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length]);

  /*
  |--------------------------------------------------------------------------
  | Keep Current Index Valid
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slides.length]);

  /*
  |--------------------------------------------------------------------------
  | No Slides
  |--------------------------------------------------------------------------
  */

  if (slides.length === 0) {
    return (
      <div className="flex aspect-[1920/620] w-full items-center justify-center bg-brand-navy px-6">
        <div className="text-center text-white">
          <p className="text-sm font-bold sm:text-lg">
            Comfort made for your home.
          </p>

          <Link
            href="/shop"
            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-brand-yellow px-5 text-xs font-bold text-brand-navy sm:min-h-11 sm:text-sm"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  const image = (
    <img
      key={currentSlide.id}
      src={getSlideImage(currentSlide)}
      alt={currentSlide.title}
      className="block h-full w-full object-contain"
    />
  );

  return (
    <div className="relative aspect-[1920/620] w-full overflow-hidden bg-brand-navy">
      {currentSlide.link_url ? (
        <Link
          href={currentSlide.link_url}
          aria-label={currentSlide.title}
          className="block h-full w-full"
        >
          {image}
        </Link>
      ) : (
        image
      )}

      {/* Slide Counter - desktop/tablet only */}
      {slides.length > 1 && (
        <div className="absolute right-2 top-2 hidden rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm sm:block sm:right-4 sm:top-4">
          {currentIndex + 1} / {slides.length}
        </div>
      )}

      {/* Navigation Dots */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1.5 sm:bottom-3 sm:gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Show ${slide.title}`}
              aria-current={
                index === currentIndex
                  ? "true"
                  : undefined
              }
              className={`rounded-full shadow-sm transition-all duration-300 ${
                index === currentIndex
                  ? "h-1.5 w-5 bg-brand-yellow sm:h-2 sm:w-7"
                  : "h-1.5 w-1.5 bg-white/85 hover:bg-white sm:h-2 sm:w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}