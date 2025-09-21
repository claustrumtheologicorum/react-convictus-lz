'use client';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import Link from 'next/link';
import Image from 'next/image';

export type SwipeCard = {
  key: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  coverUrl?: string;
  href: string;               // ← link target
};

export default function SwipeStack({cards}:{cards:SwipeCard[]}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Swiper spaceBetween={16} slidesPerView={1}>
        {cards.map((c) => (
          <SwiperSlide key={c.key}>
            <Link href={c.href} className="block group border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
              {/* Cover */}
              {c.coverUrl && (
                <div className="relative w-full h-48">
                  {/* works with external URLs too */}
                  <Image src={c.coverUrl} alt="" fill className="object-cover" />
                </div>
              )}
              {/* Text */}
              <div className="p-5">
                <h2 className="text-xl font-semibold group-hover:underline">{c.title}</h2>
                {c.subtitle && <p className="text-xs text-gray-500 mt-1">{c.subtitle}</p>}
                {c.excerpt && <p className="text-gray-700 mt-3 line-clamp-3">{c.excerpt}</p>}
                <p className="mt-4 text-sm text-blue-600">Open →</p>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
