import React, { useState } from 'react';
import { NewsroomIcon } from './NewsIcons';

interface NewsImageProps {
  src?: string | null;
  alt: string;
  mascotUrl?: string | null;
  className?: string;
  imageClassName?: string;
  aspectRatio?: string; // e.g. '16 / 9' or '1 / 1'
  width?: number | string;
  height?: number | string;
}

export const NewsImage: React.FC<NewsImageProps> = ({
  src,
  alt,
  mascotUrl,
  className = '',
  imageClassName = 'w-full h-full object-cover',
  aspectRatio,
  width,
  height,
}) => {
  const [hasError, setHasError] = useState(false);
  const [mascotError, setMascotError] = useState(false);

  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatio || undefined,
    width: width || undefined,
    height: height || undefined,
  };

  // Determine fallback when primary source is missing or broken
  const renderFallback = () => {
    if (mascotUrl && !mascotError) {
      return (
        <img
          src={mascotUrl}
          alt={alt || 'CoreIQ Weekly'}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setMascotError(true)}
          className="w-full h-full object-contain p-4 bg-[#0d1220]"
        />
      );
    }

    return (
      <div className="w-full h-full bg-[#0d1220] flex items-center justify-center p-3 text-[#9aa3b2]">
        <NewsroomIcon className="w-8 h-8 opacity-70" />
      </div>
    );
  };

  return (
    <div
      style={containerStyle}
      className={`overflow-hidden bg-[#0d1220] relative ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={imageClassName}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
};
