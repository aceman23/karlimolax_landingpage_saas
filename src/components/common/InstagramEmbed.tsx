import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InstagramImageItem {
  src: string;
  href?: string;
  alt?: string;
}

interface InstagramEmbedProps {
  profileUrl: string;
  height?: number;
  className?: string;
  images?: InstagramImageItem[];
}

export default function InstagramEmbed({ profileUrl, height = 520, className = '', images }: InstagramEmbedProps) {
  // If images are provided, render a lightweight local carousel (with autoplay)
  if (images && images.length > 0) {
    const [index, setIndex] = useState(0);
    const total = images.length;
    const [isHovered, setIsHovered] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const next = () => setIndex((i) => (i + 1) % total);
    const prev = () => setIndex((i) => (i - 1 + total) % total);

    React.useEffect(() => {
      if (total <= 1 || isHovered) return;
      const id = setInterval(() => {
        setIndex((i) => (i + 1) % total);
      }, 5000);
      return () => clearInterval(id);
    }, [total, isHovered]);

    // If all images failed to load, fallback to iframe embed
    if (errorCount >= total) {
      const base = profileUrl.split('?')[0].split('#')[0];
      const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
      const embedSrc = `${trimmed}/embed`;
      return (
        <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
          <div className="relative w-full" style={{ minHeight: height }}>
            <iframe
              title="Instagram Feed"
              src={embedSrc}
              width="100%"
              height={height}
              loading="lazy"
              frameBorder={0}
              scrolling="yes"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-4 text-center">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition"
            >
              View on Instagram
            </a>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`bg-white rounded-lg shadow-md p-4 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full overflow-hidden rounded-lg" style={{ minHeight: height }}>
          <div className="w-full h-full">
            {images.map((item, i) => (
              <a
                key={i}
                href={item.href || profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full h-full ${i === index ? '' : 'hidden'}`}
              >
                <img
                  src={item.src}
                  alt={item.alt || 'Instagram post'}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: height }}
                  onError={() => setErrorCount((c) => c + 1)}
                />
              </a>
            ))}
          </div>

          {total > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? 'bg-cyan-600' : 'bg-gray-300'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-4 text-center">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition"
          >
            View on Instagram
          </a>
        </div>
      </div>
    );
  }

  // Fallback to Instagram's embedded profile iframe
  const base = profileUrl.split('?')[0].split('#')[0];
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  const embedSrc = `${trimmed}/embed`;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="relative w-full" style={{ minHeight: height }}>
        <iframe
          title="Instagram Feed"
          src={embedSrc}
          width="100%"
          height={height}
          loading="lazy"
          frameBorder={0}
          scrolling="yes"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="mt-4 text-center">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition"
        >
          View on Instagram
        </a>
      </div>
    </div>
  );
} 