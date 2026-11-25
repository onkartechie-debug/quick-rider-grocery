import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/** Lazy image that falls back to a neutral placeholder if the URL is missing or broken. */
export default function SmartImage({ src, alt, className = '', iconClassName = 'h-6 w-6' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ${className}`}>
        <ImageOff className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
