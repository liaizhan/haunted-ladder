const SVG_NS = 'http://www.w3.org/2000/svg';

/** The WebP pictures in `public/art/`. All of them are decorative. */
export const ART_NAMES = [
  'steppe-night',
  'zheztyrnaq',
  'peri',
  'spirit-turning',
  'shanyraq',
  'asyq',
  'tumar',
  'burkit',
  'qobyz',
  'step',
  'star',
] as const;
export type ArtName = (typeof ART_NAMES)[number];

/** Every picture address starts with the Vite base, so it works under /haunted-ladder/. */
export const ART_BASE = `${import.meta.env.BASE_URL}art/`;

export function artUrl(name: ArtName): string {
  return `${ART_BASE}${name}.webp`;
}

/** A decorative `<image>` for inline SVG. Hidden from screen readers. */
export function svgArt(
  name: ArtName,
  className: string,
  attrs: Record<string, string | number> = {},
): SVGImageElement {
  const node = document.createElementNS(SVG_NS, 'image');
  node.setAttribute('class', className);
  node.setAttribute('href', artUrl(name));
  node.setAttribute('aria-hidden', 'true');
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** A decorative `<img>` for HTML. Empty alt text and hidden from screen readers. */
export function htmlArt(name: ArtName, className: string, size: number): HTMLImageElement {
  const img = document.createElement('img');
  img.className = className;
  img.src = artUrl(name);
  img.alt = '';
  img.width = size;
  img.height = size;
  img.decoding = 'async';
  img.setAttribute('aria-hidden', 'true');
  return img;
}
