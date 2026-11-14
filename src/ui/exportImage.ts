import { isFaded, type Ghost } from '../domain/ghosts';
import { wrapText } from './staircase';
import { DAWN_BOTTOM, DAWN_TEXT, DAWN_TOP, isDawn } from './dawn';
import { en } from '../locales/en';
import { t } from '../i18n';

const NS = 'http://www.w3.org/2000/svg';
const NIGHT = '#14112B';
const MOON = '#F4EFE6';
const MIST = '#A9A3C7';
const PUMPKIN = '#FF8A3D';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** English texts. The picture itself uses the current language through `t()`. */
export const CREDIT_LINE = en.creditLine;
export const FILE_NAME = 'haunted-ladder.png';
export const SAVE_FAILED_MESSAGE = en.saveFailed;

const SCALE = 2;

/** Opacity of the steppe picture at dawn. The CSS on the page uses the same number. */
export const DAWN_BACKDROP_OPACITY = 0.35;

/** Turns a picture address into a `data:` URL. Rejects when the picture cannot be loaded. */
export type ImageLoader = (url: string) => Promise<string>;

export const loadAsDataUrl: ImageLoader = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('The picture could not be loaded.');
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No data.')));
    reader.onerror = () => reject(new Error('The picture could not be read.'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Replaces the address of every `<image>` with a `data:` URL, because a picture drawn from an SVG
 * cannot load files by itself. An image that cannot be loaded is removed, so saving still works.
 */
export async function inlineImages(root: SVGSVGElement, load: ImageLoader = loadAsDataUrl): Promise<void> {
  const cache = new Map<string, Promise<string>>();
  const nodes = Array.from(root.querySelectorAll('image'));
  await Promise.all(
    nodes.map(async (node) => {
      const href = node.getAttribute('href') ?? '';
      if (href.startsWith('data:')) return;
      try {
        let pending = cache.get(href);
        if (!pending) {
          pending = load(href);
          cache.set(href, pending);
        }
        const data = await pending;
        if (!data.startsWith('data:')) throw new Error('Not a data URL.');
        node.setAttribute('href', data);
      } catch {
        node.remove();
      }
    }),
  );
}

function text(
  content: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  anchor: 'start' | 'middle' = 'start',
): SVGTextElement {
  const t = document.createElementNS(NS, 'text');
  t.setAttribute('x', String(x));
  t.setAttribute('y', String(y));
  t.setAttribute('font-size', String(size));
  t.setAttribute('fill', fill);
  t.setAttribute('text-anchor', anchor);
  t.setAttribute('font-family', FONT);
  t.textContent = content;
  return t;
}

function viewBoxSize(svg: SVGSVGElement): { w: number; h: number } {
  const parts = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  const w = parts[2];
  const h = parts[3];
  if (w === undefined || h === undefined || !(w > 0) || !(h > 0)) {
    throw new Error('The staircase has no size.');
  }
  return { w, h };
}

/**
 * Makes a stand-alone copy of the staircase for the picture: night background,
 * every written step under the staircase, and the credit line at the bottom.
 * Faded ghosts stay faded because the copy keeps their opacity. The input is not changed.
 * Person text is written only as SVG text nodes.
 */
export function buildExportSvg(svg: SVGSVGElement, ghosts: Ghost[]): SVGSVGElement {
  const { w, h } = viewBoxSize(svg);
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.querySelectorAll('.motes').forEach((m) => m.remove());
  // The turning picture is invisible except during the CSS animation, so it is left out.
  copy.querySelectorAll('.spirit-turning').forEach((m) => m.remove());

  const dawn = isDawn(ghosts);
  const ink = dawn ? DAWN_TEXT : MOON;
  const softInk = dawn ? DAWN_TEXT : MIST;
  const accent = dawn ? DAWN_TEXT : PUMPKIN;

  const written = ghosts.filter(isFaded);
  const rows: { fear: string[]; step: string[] }[] = written.map((g) => ({
    fear: wrapText(t('exportFear', { fear: g.fear }), 80, 2),
    step: wrapText(t('exportStep', { step: g.step.trim() }), 80, 3),
  }));
  const lineH = 16;
  let extra = 20;
  if (dawn) extra += 30;
  if (rows.length > 0) {
    extra += 30;
    for (const r of rows) extra += (r.fear.length + r.step.length) * lineH + 10;
  }
  extra += 40;
  const total = h + extra;

  copy.setAttribute('xmlns', NS);
  copy.setAttribute('viewBox', `0 0 ${w} ${total}`);
  copy.setAttribute('width', String(w));
  copy.setAttribute('height', String(total));

  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', String(w));
  bg.setAttribute('height', String(total));
  bg.setAttribute('fill', dawn ? 'url(#dawn-sky)' : NIGHT);
  copy.insertBefore(bg, copy.firstChild);

  if (dawn) {
    // The night becomes morning: sky gradient, a sun behind the top of the ladder, no moon.
    copy.querySelector('.moon')?.remove();
    // The night steppe lets the dawn sky show through, like the CSS on the page.
    copy.querySelector('.backdrop')?.setAttribute('opacity', String(DAWN_BACKDROP_OPACITY));
    const defs = document.createElementNS(NS, 'defs');
    const grad = document.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', 'dawn-sky');
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');
    for (const [offset, color] of [
      ['0', DAWN_TOP],
      ['1', DAWN_BOTTOM],
    ] as const) {
      const stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', color);
      grad.append(stop);
    }
    defs.append(grad);
    const sun = document.createElementNS(NS, 'circle');
    sun.setAttribute('class', 'sun');
    sun.setAttribute('cx', String(w - 90));
    sun.setAttribute('cy', '70');
    sun.setAttribute('r', '36');
    sun.setAttribute('fill', '#FFC94D');
    bg.after(defs, sun);
  }

  let y = h + 20;
  if (dawn) {
    copy.appendChild(text(t('dawnLine'), w / 2, y + 6, 14, DAWN_TEXT, 'middle'));
    y += 30;
  }
  if (rows.length > 0) {
    copy.appendChild(text(t('exportTitle'), 40, y + 8, 15, accent));
    y += 30;
    for (const r of rows) {
      for (const line of r.fear) {
        y += lineH;
        copy.appendChild(text(line, 40, y, 12, softInk));
      }
      for (const line of r.step) {
        y += lineH;
        copy.appendChild(text(line, 40, y, 12, ink));
      }
      y += 10;
    }
  }
  copy.appendChild(text(t('creditLine'), w / 2, total - 16, 11, softInk, 'middle'));
  return copy;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The picture could not be drawn.'));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No PNG was made.'))), 'image/png');
  });
}

export type SaveResult = { ok: true } | { ok: false; message: string };

/**
 * Draws the staircase on a canvas at 2x and downloads `haunted-ladder.png`.
 * Everything happens in the browser; nothing is sent anywhere.
 * Never throws: on failure it returns a short message to show to the person.
 */
export async function saveLadderImage(
  svg: SVGSVGElement,
  ghosts: Ghost[],
  load: ImageLoader = loadAsDataUrl,
): Promise<SaveResult> {
  let svgUrl: string | null = null;
  let pngUrl: string | null = null;
  try {
    const copy = buildExportSvg(svg, ghosts);
    await inlineImages(copy, load);
    const w = Number(copy.getAttribute('width'));
    const h = Number(copy.getAttribute('height'));
    const xml = new XMLSerializer().serializeToString(copy);
    svgUrl = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    const img = await loadImage(svgUrl);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * SCALE);
    canvas.height = Math.round(h * SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    pngUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = FILE_NAME;
    document.body.append(a);
    a.click();
    a.remove();
    return { ok: true };
  } catch {
    return { ok: false, message: t('saveFailed') };
  } finally {
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    if (pngUrl) {
      const url = pngUrl;
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  }
}
