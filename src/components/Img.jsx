/**
 * One image in the smallest format the browser supports (AVIF, else WebP), at the width the
 * layout needs. `sizes` tells the browser how wide it will be shown. Width and height reserve
 * the space so the page doesn't jump while it loads.
 */
export default function Img({ img, alt, sizes = '100vw', className, priority = false, style }) {
  return (
    <picture>
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={img.src}
        alt={alt}
        width={img.width}
        height={img.height}
        className={className}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  );
}
