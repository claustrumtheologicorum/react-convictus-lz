'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import Link from 'next/link';

export type SwipeCard = {
  key: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  coverUrl?: string;
  href: string;
};

export default function SwipeStack({cards}: {cards: SwipeCard[]}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Swiper spaceBetween={16} slidesPerView={1}>
        {cards.map((c) => (
          <SwiperSlide key={c.key}>
            <Link
              href={c.href}
              prefetch={false}
              className="block group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition"
            >
              <div className="relative h-72 md:h-80">
                {/* Cover image (plain <img> to avoid domain + expiry issues) */}
                {c.coverUrl ? (
                  <img
                    src={c.coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200" />
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/45 transition group-hover:bg-black/55" />

                {/* Text content */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  {c.subtitle && (
                    <p className="text-xs md:text-sm opacity-80">{c.subtitle}</p>
                  )}
                  <h2 className="mt-1 text-xl md:text-2xl font-semibold leading-snug">
                    {c.title}
                  </h2>
                  {c.excerpt && (
                    <p className="mt-2 text-sm md:text-base opacity-90 line-clamp-3">
                      {c.excerpt}
                    </p>
                  )}
                  <p className="mt-3 text-sm opacity-90 underline decoration-white/40 group-hover:decoration-white">
                    Read more →
                  </p>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
