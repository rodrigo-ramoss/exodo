import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface AppImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

function normalizeImageSrc(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  return encodeURI(raw);
}

export function AppImage({
  src,
  alt = '',
  className,
  priority = false,
  fallbackClassName,
  ...rest
}: AppImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageSrc(src), [src]);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || broken) {
    return (
      <div
        className={cn(className, 'bg-[#20242b]', fallbackClassName)}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      {...rest}
      src={normalizedSrc}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      onError={() => setBroken(true)}
    />
  );
}
