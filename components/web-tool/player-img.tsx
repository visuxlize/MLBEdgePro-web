"use client";

interface Props {
  src: string;
  alt: string;
  className?: string;
  objectPosition?: string;
}

export function PlayerImg({ src, alt, className, objectPosition }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
