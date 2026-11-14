import type { ImgHTMLAttributes } from 'react';
import avatar from '../../public/img/avatar.webp';
import cutout from '../../public/img/moussa-cutout.webp';

const assets: Record<string, string> = { '/img/avatar.webp': avatar, '/img/moussa-cutout.webp': cutout };

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; fill?: boolean; priority?: boolean };
export default function Image({ src, fill, priority, style, ...rest }: Props) {
  return (
    <img
      src={assets[src] ?? src}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
      {...rest}
    />
  );
}
