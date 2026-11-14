import type { Reading, Step } from '../domain/server';
import { isFaded, type Ghost } from '../domain/ghosts';
import { t } from '../i18n';
import { artUrl, svgArt, type ArtName } from './art';

const NS = 'http://www.w3.org/2000/svg';

// Colors are literal (not CSS variables) so the exported PNG looks the same.
const NIGHT = '#14112B';
const NIGHT_2 = '#221C45';
const MOON = '#F4EFE6';
const MIST = '#A9A3C7';
const PUMPKIN = '#FF8A3D';
const GOLD = '#E8B04A';
const SHADOW = '#0B0919';
const SKY = '#061331';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Average glyph width (px at font-size 11) used for wrapping; tests use it to size text boxes. */
export const CHAR_W = 6.2;
/** Note text colors: MOON text on the solid NIGHT_2 card fill. */
export const STEP_FILL = NIGHT_2;
export const LABEL_COLOR = MOON;
/** Glyph width estimate at a given font size (CHAR_W is for size 11). */
export const charWidth = (size: number): number => (CHAR_W * size) / 11;

/** The picture is drawn at 1 unit = 1 CSS px for containers from VIEW_MIN to VIEW_MAX. */
export const VIEW_MIN = 300;
export const VIEW_MAX = 680;
/** Containers narrower than this (CSS px) are reported as the "narrow" layout. */
export const NARROW_MAX = 640;
export const NARROW_MIN = VIEW_MIN;
/** Below this width the scene uses the phone sizes. */
export const PHONE_MAX = 520;
/** From this width the word cards stand in two columns. */
export const TWO_COLUMNS = 600;

export const PAD = 12;
export const CARD_H = 54;
export const CARD_PAD = 8;
export const CARD_GAP = 8;
export const NOTE_FONT = 13;
export const NOTE_LINES = 3;
/** Number disc at the left of every card. */
export const NUM_R = 13;
/** Golden emblem (or small spirit) next to the number. */
export const EMBLEM_SIZE = 28;
/** Room taken by the number disc and the emblem before the words of a card. */
export const TEXT_ROOM = 2 * NUM_R + 6 + EMBLEM_SIZE + 8;
/** The carpet step picture is 388 x 91. */
const STEP_RATIO = 91 / 388;
/** The night steppe picture is 1376 x 768. */
const STEPPE_RATIO = 768 / 1376;
/** The spirit pictures are about 0.69 as wide as tall. */

export type StaircaseOptions = {
  /** Container width in CSS px. Clamped to 300..680. 0 or missing means 680. */
  width?: number;
};

export type Layout = {
  /** Width of the picture in SVG units (= CSS px). */
  vw: number;
  /** Number of steps. */
  n: number;
  narrow: boolean;
  phone: boolean;
  /** Size factor of numbers, stars and emblems in the scene. */
  k: number;
  /** Height of the sky band where the spirits fly. */
  bandH: number;
  /** How much each step rises above the one before. */
  rise: number;
  /** Step picture width and height. */
  sw: number;
  sh: number;
  /** How far right each step stands from the one before. */
  shift: number;
  /** Height of the night scene; the word cards start under it. */
  sceneH: number;
  cols: number;
  cardW: number;
  cardsY: number;
  height: number;
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const r1 = (v: number): number => Math.round(v * 10) / 10;

/** One geometry for every width. `count` is the number of steps, fears included. */
export function staircaseLayout(count: number, width?: number): Layout {
  const n = Math.max(1, count);
  const cw = width !== undefined && width > 0 ? width : VIEW_MAX;
  const vw = clamp(Math.round(cw), VIEW_MIN, VIEW_MAX);
  const phone = vw < PHONE_MAX;
  const k = phone ? 1 : 1.25;
  const bandH = phone ? 175 : 220;
  const rise = phone ? 54 : 64;
  const sw = Math.min(phone ? 170 : 260, vw - 2 * PAD);
  const shift = n > 1 ? (vw - 2 * PAD - sw) / (n - 1) : 0;
  const sceneH = Math.round(bandH + (n - 1) * rise + 70 * k + 16);
  const cols = vw >= TWO_COLUMNS ? 2 : 1;
  const cardW = r1((vw - 2 * PAD - (cols - 1) * CARD_GAP) / cols);
  const rows = Math.ceil(n / cols);
  const cardsY = sceneH + 12;
  return {
    vw,
    n,
    narrow: cw < NARROW_MAX,
    phone,
    k,
    bandH,
    rise,
    sw,
    sh: r1(sw * STEP_RATIO),
    shift,
    sceneH,
    cols,
    cardW,
    cardsY,
    height: cardsY + rows * (CARD_H + CARD_GAP) - CARD_GAP + PAD,
  };
}

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function hidden<T extends Element>(node: T): T {
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/** Word wrap by character count. Long words are cut. Extra lines end with an ellipsis. */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const max = Math.max(1, maxChars);
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let w = word;
    while (w.length > max) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      lines.push(w.slice(0, max));
      w = w.slice(max);
    }
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= max) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    const last = lines[maxLines - 1] ?? '';
    lines[maxLines - 1] = last.slice(0, Math.max(0, max - 1)) + '…';
  }
  return lines.length ? lines : [''];
}

/** SVG text with one tspan per line. User words only go in through textContent. */
function textBlock(
  lines: string[],
  x: number,
  y: number,
  size: number,
  fill: string,
  anchor: 'start' | 'middle',
): SVGTextElement {
  const node = el('text', {
    x,
    y,
    'font-size': size,
    fill,
    'text-anchor': anchor,
    'font-family': FONT,
  });
  lines.forEach((line, i) => {
    const span = el('tspan', { x, dy: i === 0 ? 0 : size * 1.25 });
    span.textContent = line;
    node.appendChild(span);
  });
  return node;
}

function cobweb(x: number, y: number, w: number, h: number): SVGGElement {
  const g = hidden(
    el('g', { class: 'cobweb', fill: 'none', stroke: MIST, 'stroke-width': 1, opacity: 0.6 }),
  );
  const mx = x + w / 2;
  const my = y + h / 2;
  g.appendChild(el('path', { d: `M${x} ${y} L${x + w} ${y + h}` }));
  g.appendChild(el('path', { d: `M${x + w} ${y} L${x} ${y + h}` }));
  g.appendChild(el('path', { d: `M${mx} ${y} L${mx} ${y + h}` }));
  g.appendChild(el('path', { d: `M${x} ${my} L${x + w} ${my}` }));
  for (const f of [0.35, 0.7]) {
    const rx = (w / 2) * f;
    const ry = (h / 2) * f;
    g.appendChild(
      el('path', {
        d: `M${mx - rx} ${my} Q${mx} ${my - ry * 1.6} ${mx + rx} ${my} Q${mx} ${my + ry * 1.6} ${mx - rx} ${my}`,
      }),
    );
  }
  return g;
}

/** Ids of gradients and filters are unique per picture, so two staircases never share them. */
let pictureCount = 0;
type Ids = { blood: string; shade: string; smear: string; soft: string; haloGold: string; haloCold: string; skyFade: string };

const stepX = (i: number, L: Layout): number => r1(PAD + i * L.shift);
const stepY = (i: number, L: Layout): number => r1(L.bandH + (L.n - 1 - i) * L.rise + 4);

function badgeLabel(step: Step): string | null {
  if (step.zone === 'current') return t('badgeMe');
  if (step.zone === 'goal') return t('badgeGoal');
  return null;
}

/** The golden emblem of a step that is not a fear. */
function emblemFor(step: Step, nearest: boolean): ArtName {
  if (step.zone === 'current') return 'shanyraq';
  if (step.zone === 'goal') return 'burkit';
  return nearest ? 'asyq' : 'tumar';
}

/** A dark fear step looks cold and dim until its spirit has a small step. */
const DIM_STEP = 'filter: brightness(.5) saturate(.3) hue-rotate(200deg)';
const EMBLEM_GLOW =
  'filter: drop-shadow(0 0 .6px #0B0919) drop-shadow(0 0 .6px #0B0919) drop-shadow(0 1px 1px #0B0919) drop-shadow(0 0 5px rgba(255,194,74,.55))';
const STAR_GLOW = 'filter: drop-shadow(0 0 6px #FFC24A) drop-shadow(0 0 12px #FF9A2A)';

type NumStyle = { fill: string; stroke: string; dash: string | null; text: string };

function numStyle(step: Step, lit: boolean): NumStyle {
  if (step.zone !== 'fear') return { fill: GOLD, stroke: GOLD, dash: null, text: NIGHT };
  return lit
    ? { fill: PUMPKIN, stroke: PUMPKIN, dash: null, text: NIGHT }
    : { fill: NIGHT, stroke: MIST, dash: '3 2', text: MOON };
}

function paintNum(disc: Element | null, label: Element | null, s: NumStyle): void {
  if (disc) {
    disc.setAttribute('fill', s.fill);
    disc.setAttribute('stroke', s.stroke);
    if (s.dash) disc.setAttribute('stroke-dasharray', s.dash);
    else disc.removeAttribute('stroke-dasharray');
  }
  label?.setAttribute('fill', s.text);
}

/** First text baseline so a block of `lines` lines sits in the middle of a card. */
function noteBaseline(cardY: number, lines: number): number {
  const total = NOTE_FONT + (lines - 1) * NOTE_FONT * 1.25;
  return r1(cardY + CARD_H / 2 - total / 2 + NOTE_FONT * 0.77);
}

/**
 * One step: the carpet step in the night scene (with its number, emblem and star) and its word
 * card under the scene. The card carries the person's words.
 */
function stairGroup(
  step: Step,
  index: number,
  L: Layout,
  nearest: boolean,
  fearIndex: number | null,
): SVGGElement {
  const cls = ['stair', `stair-${step.zone}`, nearest ? 'nearest' : ''].filter(Boolean).join(' ');
  const g = el('g', { class: cls, 'data-zone': step.zone });
  if (fearIndex !== null) g.setAttribute('data-fear', String(fearIndex));
  g.setAttribute('role', 'img');
  g.setAttribute('aria-label', `${step.zoneLabel}: ${step.text}`);
  const title = el('title');
  title.textContent = step.text; // the full words, even when the card text is cut
  g.appendChild(title);

  // The step in the scene.
  const x = stepX(index, L);
  const y = stepY(index, L);
  const plate = svgArt('step', 'plate', { x, y, width: L.sw, height: L.sh, preserveAspectRatio: 'none' });
  if (fearIndex !== null) plate.setAttribute('data-ghost', String(fearIndex));
  g.appendChild(plate);

  const num = hidden(
    el('text', {
      class: 'plate-num',
      x: r1(x + L.sw * 0.52),
      y: r1(y + L.sh * 0.74),
      'font-size': r1(11 * L.k),
      'font-weight': 800,
      'text-anchor': 'middle',
      fill: '#FFE3A3',
      stroke: NIGHT,
      'stroke-width': 3,
      'paint-order': 'stroke',
      'font-family': FONT,
    }),
  );
  num.textContent = String(step.number);
  g.appendChild(num);

  if (step.zone !== 'fear') {
    const es = r1(17 * L.k * 2.3);
    g.appendChild(
      svgArt(emblemFor(step, nearest), 'step-emblem', {
        x: r1(x + L.sw * 0.8 - es / 2),
        y: r1(y + L.sh * 0.62 - es / 2),
        width: es,
        height: es,
        style: EMBLEM_GLOW,
      }),
    );
  }

  const starS = r1(20 * L.k);
  const starX = r1(x + L.sw * 0.3 - starS / 2);
  const starY = r1(y - 14 * L.k);
  if (step.zone === 'goal') {
    // The light the motes fly to at dawn.
    g.appendChild(
      hidden(
        el('circle', {
          class: 'goal-light',
          cx: r1(starX + starS / 2),
          cy: r1(starY + starS / 2),
          r: r1(starS * 0.7),
          fill: '#FFC24A',
          opacity: 0.35,
        }),
      ),
    );
  }
  const star = svgArt('star', 'step-star', { x: starX, y: starY, width: starS, height: starS, style: STAR_GLOW });
  g.appendChild(star);

  // The word card.
  const col = index % L.cols;
  const row = Math.floor(index / L.cols);
  const cx = r1(PAD + col * (L.cardW + CARD_GAP));
  const cy = L.cardsY + row * (CARD_H + CARD_GAP);
  const midY = cy + CARD_H / 2;
  g.appendChild(
    el('rect', {
      class: 'note',
      x: cx,
      y: cy,
      width: L.cardW,
      height: CARD_H,
      rx: 10,
      fill: NIGHT_2,
      stroke: nearest ? PUMPKIN : MIST,
      'stroke-opacity': nearest ? 1 : 0.35,
      'stroke-width': nearest ? 2 : 1,
    }),
  );
  if (step.zone === 'block') g.appendChild(cobweb(r1(cx + L.cardW - 22), cy + 2, 20, 18));

  const style = numStyle(step, false);
  const disc = el('circle', {
    class: 'num-disc',
    cx: cx + CARD_PAD + NUM_R,
    cy: midY,
    r: NUM_R,
    'stroke-width': 1.5,
  });
  const cardNum = el('text', {
    class: 'card-num',
    x: cx + CARD_PAD + NUM_R,
    y: midY + 5,
    'font-size': 14,
    'font-weight': 700,
    'text-anchor': 'middle',
    'font-family': FONT,
  });
  cardNum.textContent = String(step.number);
  paintNum(disc, cardNum, style);
  g.appendChild(hidden(disc));
  g.appendChild(hidden(cardNum));

  const iconX = cx + CARD_PAD + 2 * NUM_R + 6;
  const icon = { x: iconX, y: midY - EMBLEM_SIZE / 2, width: EMBLEM_SIZE, height: EMBLEM_SIZE };
  if (step.zone === 'fear') g.appendChild(svgArt('zheztyrnaq', 'card-spirit', icon));
  else g.appendChild(svgArt(emblemFor(step, nearest), 'emblem', { 'data-emblem': emblemFor(step, nearest), ...icon }));

  let left = TEXT_ROOM;
  const badge = badgeLabel(step);
  if (badge !== null) {
    const bw = Math.ceil(badge.length * charWidth(11) * 1.15) + 14;
    const bx = cx + CARD_PAD + TEXT_ROOM;
    g.appendChild(
      el('rect', {
        class: 'badge',
        x: bx,
        y: midY - 8,
        width: bw,
        height: 16,
        rx: 8,
        fill: step.zone === 'goal' ? PUMPKIN : MOON,
      }),
    );
    const bt = el('text', {
      class: 'badge-text',
      x: bx + bw / 2,
      y: midY + 4,
      'font-size': 11,
      'font-weight': 700,
      fill: NIGHT,
      'text-anchor': 'middle',
      'font-family': FONT,
    });
    bt.textContent = badge;
    g.appendChild(bt);
    left = TEXT_ROOM + bw + 6;
  }

  const avail = L.cardW - 2 * CARD_PAD - left;
  const chars = Math.max(1, Math.floor(avail / charWidth(NOTE_FONT)));
  const lines = wrapText(step.text, chars, NOTE_LINES);
  const label = textBlock(lines, cx + CARD_PAD + left, noteBaseline(cy, lines.length), NOTE_FONT, LABEL_COLOR, 'start');
  label.setAttribute('class', 'step-label');
  g.appendChild(label);
  return g;
}

/** The blood moon behind the spirits: a dark eclipse with a thin red rim, blotches, black cloud strands and two bats. */
function moonGroup(cx: number, cy: number, r: number, ids: Ids): SVGGElement {
  const g = hidden(el('g', { class: 'moon-sky' }));
  const glow = el('g', { class: 'moon-glow' });
  for (const [k, o] of [
    [2.4, 0.05],
    [1.8, 0.09],
    [1.3, 0.16],
  ] as const) {
    glow.appendChild(el('circle', { cx, cy, r: r1(r * k), fill: '#6E0909', opacity: o }));
  }
  g.appendChild(glow);
  g.appendChild(el('circle', { class: 'moon', cx, cy, r, fill: `url(#${ids.blood})` }));
  // Dark blotches like dried blood.
  for (const [dx, dy, rr] of [
    [-0.35, -0.2, 0.2],
    [0.25, 0.3, 0.16],
    [0.1, -0.45, 0.1],
    [-0.2, 0.42, 0.11],
    [0.45, -0.1, 0.12],
    [-0.55, 0.15, 0.09],
  ] as const) {
    g.appendChild(el('circle', { cx: r1(cx + dx * r), cy: r1(cy + dy * r), r: r1(rr * r), fill: '#1C0203', opacity: 0.5, filter: `url(#${ids.smear})` }));
  }
  // The eclipse shadow eats the lower right side; a thin red rim stays.
  g.appendChild(el('circle', { cx, cy, r, fill: `url(#${ids.shade})` }));
  g.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#C4170F', 'stroke-width': 1.5, opacity: 0.75 }));
  const q = (v: number): number => r1(v * r);
  // Black cloud strands across the moon.
  for (const [x0, y, len, bend, w, o] of [
    [-1.45, -0.28, 2.3, -0.2, 0.11, 0.85],
    [-0.4, 0.22, 1.9, 0.16, 0.08, 0.75],
  ] as const) {
    const k = len / 3;
    g.appendChild(
      el('path', {
        class: 'moon-strand',
        d: `M${r1(cx + r * x0)} ${r1(cy + r * y)} c${q(k)} ${q(bend)} ${q(2 * k)} ${q(-bend * 1.4)} ${q(len)} ${q(bend * 0.3)}`,
        fill: 'none',
        stroke: SHADOW,
        'stroke-width': q(w),
        'stroke-linecap': 'round',
        opacity: o,
        filter: `url(#${ids.smear})`,
      }),
    );
  }
  for (const [bx, by, s] of [
    [cx + r * 0.55, cy - r * 0.7, 1],
    [cx - r * 0.9, cy - r * 0.2, 0.7],
  ] as const) {
    const b = (v: number): number => r1(v * s);
    g.appendChild(
      el('path', {
        class: 'bat',
        d: `M${r1(bx)} ${r1(by)} q${b(-6)} ${b(-6)} ${b(-14)} ${b(-2)} q${b(4)} ${b(1)} ${b(5)} ${b(5)} q${b(3)} ${b(-3)} ${b(9)} ${b(-1)} q${b(6)} ${b(-2)} ${b(9)} ${b(1)} q${b(1)} ${b(-4)} ${b(5)} ${b(-5)} q${b(-8)} ${b(-4)} ${b(-14)} ${b(2)} z`,
        fill: SHADOW,
      }),
    );
  }
  return g;
}

function defsFor(ids: Ids): SVGDefsElement {
  const defs = el('defs');
  const blood = el('radialGradient', { id: ids.blood, cx: '42%', cy: '38%', r: '65%' });
  for (const [o, c] of [
    ['0', '#8A1212'],
    ['.6', '#560808'],
    ['1', '#2A0304'],
  ] as const) {
    blood.appendChild(el('stop', { offset: o, 'stop-color': c }));
  }
  defs.appendChild(blood);
  const shade = el('linearGradient', { id: ids.shade, x1: '0', y1: '0', x2: '1', y2: '1' });
  for (const [o, c, op] of [
    ['.3', SHADOW, '0'],
    ['.62', SHADOW, '.72'],
    ['1', SHADOW, '.96'],
  ] as const) {
    shade.appendChild(el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }));
  }
  defs.appendChild(shade);
  const soft = el('filter', { id: ids.soft, x: '-20%', y: '-60%', width: '140%', height: '220%' });
  soft.appendChild(el('feGaussianBlur', { stdDeviation: 5 }));
  defs.appendChild(soft);
  const smear = el('filter', { id: ids.smear, x: '-30%', y: '-80%', width: '160%', height: '260%' });
  smear.appendChild(el('feGaussianBlur', { stdDeviation: 2.5 }));
  defs.appendChild(smear);
  for (const [id, c, o] of [
    [ids.haloGold, '#FFD27A', 0.45],
    [ids.haloCold, '#9FA8FF', 0.3],
  ] as const) {
    const h = el('radialGradient', { id });
    h.appendChild(el('stop', { offset: '0', 'stop-color': c, 'stop-opacity': o }));
    h.appendChild(el('stop', { offset: '1', 'stop-color': c, 'stop-opacity': 0 }));
    defs.appendChild(h);
  }
  const fade = el('linearGradient', { id: ids.skyFade, x1: 0, y1: 0, x2: 0, y2: 1 });
  fade.appendChild(el('stop', { offset: '0', 'stop-color': SKY, 'stop-opacity': 1 }));
  fade.appendChild(el('stop', { offset: '1', 'stop-color': SKY, 'stop-opacity': 0 }));
  defs.appendChild(fade);
  return defs;
}

/**
 * Each spirit stands at its own fear step, in its own pose: the first two beside the step with the
 * waist at its level (right, then left), the third half lying on its step. `lab` and `labDy` move
 * the number circle off the head when it would cover a step number.
 */
const SPIRIT_POSES = [
  // Step 6: right beside her step, her waist at the level of the step.
  { art: 'zheztyrnaq-rise', ratio: 0.686, h: 1.575, side: 1, lie: false, lab: 0.45, labDy: 0.12 },
  // Step 7: left beside her step, her waist at the level of the step.
  { art: 'zheztyrnaq-peek', ratio: 0.427, h: 1.575, side: -1, lie: false, lab: 0, labDy: 0 },
  // Step 8: half lies on the right part of the top step.
  { art: 'zheztyrnaq-crawl', ratio: 1.23, h: 1.125, side: 1, lie: true, lab: 0, labDy: 0 },
] as const;

function ghostGroup(g: Ghost, index: number, stepIndex: number, number: number, L: Layout, ids: Ids): SVGGElement {
  const pose = SPIRIT_POSES[index % SPIRIT_POSES.length] ?? SPIRIT_POSES[0];
  const spH = r1((L.phone ? 125 : 175) * pose.h);
  const spW = r1(spH * pose.ratio);
  const sx = stepX(stepIndex, L);
  const sy = stepY(stepIndex, L);
  const mid = sy + L.sh * 0.5;
  let cx: number;
  let top: number;
  if (pose.lie) {
    // Lies on the tread, on the right part of the step, the plate number stays clear.
    cx = sx + L.sw - spW * 0.4;
    top = sy + L.sh * 0.35 - spH;
  } else {
    // Beside the step, a little over its end, the waist at the level of the step.
    cx = (pose.side > 0 ? sx + L.sw - spW * 0.25 : sx - spW * 0.35);
    top = mid - spH * 0.45;
  }
  cx = r1(Math.min(Math.max(cx, PAD + spW / 2), L.vw - PAD - spW / 2));
  top = r1(top);
  const cy = r1(top + spH / 2);

  const root = el('g', { class: 'ghost', 'data-ghost': index });
  root.setAttribute('role', 'img');
  const title = el('title');
  title.textContent = g.fear;
  root.appendChild(title);

  // Each ghost floats in its own loop of 3, 4 or 5 seconds, with its own phase.
  const duration = 3 + (index % 3);
  const float = el('g', {
    class: 'ghost-float',
    style: `animation-duration:${duration}s;animation-delay:-${(index * 1.3).toFixed(1)}s`,
  });
  // `.ghost-body` keeps a plain translate(x y). The Zheztyrnaq and the Peri stand on top of
  // each other; applyGhostState decides which one is shown. The turning picture is a short
  // CSS-only flash between the two.
  const body = el('g', { class: 'ghost-body', transform: `translate(${cx} ${cy})` });
  const halo = { cx: 0, cy: 0, rx: r1(spW * 0.6), ry: r1(spH * 0.5) };
  body.appendChild(hidden(el('ellipse', { class: 'halo-cold', ...halo, fill: `url(#${ids.haloCold})` })));
  body.appendChild(hidden(el('ellipse', { class: 'halo-gold', ...halo, fill: `url(#${ids.haloGold})`, opacity: 0 })));
  const spirit = { x: r1(-spW / 2), y: r1(-spH / 2), width: spW, height: spH };
  body.appendChild(svgArt(pose.art, 'spirit-dark', { ...spirit, opacity: 1 }));
  body.appendChild(svgArt('peri', 'spirit-light', { ...spirit, opacity: 0 }));
  body.appendChild(svgArt('spirit-turning', 'spirit-turning', { ...spirit, opacity: 0 }));
  float.appendChild(body);
  root.appendChild(float);

  // The number of its step stays still over the spirit's head.
  const lx = r1(Math.min(cx + spW * pose.lab, L.vw - PAD - 12));
  const ty = r1(top - 8 + spH * pose.labDy);
  root.appendChild(hidden(el('circle', { class: 'ghost-num', cx: lx, cy: ty, r: 11, 'stroke-width': 1.5 })));
  const label = hidden(
    el('text', {
      class: 'ghost-label',
      x: lx,
      y: r1(ty + 4.5),
      'font-size': 13,
      'font-weight': 700,
      'text-anchor': 'middle',
      'font-family': FONT,
    }),
  );
  label.textContent = String(number);
  root.appendChild(label);

  // The check stays still and crisp. A dark outline under the pumpkin stroke keeps it visible
  // on the golden Peri.
  const check = el('g', { class: 'ghost-check', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const d = `M${r1(cx + spW * 0.22)} ${r1(top + spH * 0.72)} l5 6 l10 -12`;
  check.appendChild(el('path', { d, stroke: NIGHT, 'stroke-width': 7 }));
  check.appendChild(el('path', { d, stroke: PUMPKIN, 'stroke-width': 3.5 }));
  root.appendChild(check);
  return root;
}

function restartTurn(root: Element): void {
  // Remove and add the class again so the CSS turning animation plays from the start.
  root.classList.remove('turning');
  void root.getBoundingClientRect();
  root.classList.add('turning');
}

const FEAR_STEP: Step = { number: 0, zone: 'fear', zoneLabel: '', text: '' };

function applyGhostState(
  svg: Element,
  root: Element,
  ghost: Ghost,
  index: number,
  animate = false,
): void {
  const faded = isFaded(ghost);
  const changed = root.classList.contains('faded') !== faded;
  root.classList.toggle('faded', faded);
  root.setAttribute(
    'aria-label',
    faded ? t('ghostFadedAria', { fear: ghost.fear }) : t('ghostAria', { fear: ghost.fear }),
  );
  // The Zheztyrnaq turns into the Peri at full strength, and back when the step is cleared.
  root.querySelector('.spirit-dark')?.setAttribute('opacity', faded ? '0' : '1');
  root.querySelector('.spirit-light')?.setAttribute('opacity', faded ? '1' : '0');
  root.querySelector('.halo-cold')?.setAttribute('opacity', faded ? '0' : '1');
  root.querySelector('.halo-gold')?.setAttribute('opacity', faded ? '1' : '0');
  root.querySelector('.ghost-check')?.setAttribute('visibility', faded ? 'visible' : 'hidden');
  const style = numStyle(FEAR_STEP, faded);
  paintNum(root.querySelector('.ghost-num'), root.querySelector('.ghost-label'), style);
  if (animate && changed) restartTurn(root);

  // Its step lights up: warm carpet, a star, an orange number and a Peri on the card.
  const stair = svg.querySelector(`.stair[data-fear="${index}"]`);
  if (!stair) return;
  const plate = stair.querySelector('.plate');
  plate?.classList.toggle('lit', faded);
  plate?.classList.toggle('dim', !faded);
  if (faded) plate?.removeAttribute('style');
  else plate?.setAttribute('style', DIM_STEP);
  const numFill = faded ? '#FFE3A3' : '#C9C4E6';
  stair.querySelector('.plate-num')?.setAttribute('fill', numFill);
  svg.querySelector(`.plate-num-over[data-fear="${index}"]`)?.setAttribute('fill', numFill);
  stair.querySelector('.step-star')?.setAttribute('visibility', faded ? 'visible' : 'hidden');
  stair.querySelector('.card-spirit')?.setAttribute('href', artUrl(faded ? 'peri' : 'zheztyrnaq'));
  paintNum(stair.querySelector('.num-disc'), stair.querySelector('.card-num'), style);
}

/**
 * Builds the night staircase: a starry steppe with the yurt and the mountains, a blood moon, the
 * big spirits of the fears across the sky, and carpet steps going up from bottom left to top
 * right, each with its number, golden emblem and star. The person's words stand in numbered cards
 * under the scene. Drawn at 1 SVG unit = 1 CSS px for containers from 300 to 680 px wide. The
 * person's phrases are written only as SVG text nodes.
 */
export function buildStaircase(
  reading: Reading,
  ghosts: Ghost[],
  opts: StaircaseOptions = {},
): SVGSVGElement {
  const steps = reading.steps;
  const L = staircaseLayout(steps.length, opts.width);
  pictureCount += 1;
  const p = `hl${pictureCount}`;
  const ids: Ids = {
    blood: `${p}-blood`,
    shade: `${p}-shade`,
    smear: `${p}-smear`,
    soft: `${p}-soft`,
    haloGold: `${p}-halo-gold`,
    haloCold: `${p}-halo-cold`,
    skyFade: `${p}-sky-fade`,
  };

  const svg = el('svg', {
    class: 'staircase',
    viewBox: `0 0 ${L.vw} ${L.height}`,
    width: '100%',
    role: 'group',
    'aria-label': t('staircaseAria'),
    'data-layout': L.narrow ? 'narrow' : 'wide',
  });

  // Night sky, then the steppe low in the picture, mirrored so the yurt with its glowing
  // shanyraq stands right of the stairs and the high peak shows on the left.
  svg.appendChild(hidden(el('rect', { class: 'night-sky', x: 0, y: 0, width: L.vw, height: L.height, fill: SKY })));
  svg.appendChild(defsFor(ids));
  const bgH = L.phone ? L.sceneH * 0.62 : L.sceneH * 0.8;
  const bgW = Math.max(L.vw, bgH / STEPPE_RATIO);
  // The yurt sits lower and further right, so its shanyraq shows past the steps and the spirits.
  const yurtDx = L.vw * 0.12;
  const yurtDy = bgH * 0.16;
  const ox = Math.min(0, Math.max(L.vw - bgW, L.vw * 0.72 - bgW * 0.72)) + yurtDx;
  const clipId = `${ids.blood}-scene`;
  const clip = el('clipPath', { id: clipId });
  clip.appendChild(el('rect', { x: 0, y: 0, width: L.vw, height: L.sceneH }));
  svg.appendChild(clip);
  svg.appendChild(
    svgArt('steppe-night', 'backdrop', {
      'clip-path': `url(#${clipId})`,
      x: 0,
      y: r1(L.sceneH - bgH + yurtDy),
      width: r1(bgW),
      height: r1(bgW * STEPPE_RATIO),
      preserveAspectRatio: 'none',
      transform: `translate(${r1(ox + bgW)} 0) scale(-1 1)`,
    }),
  );
  svg.appendChild(
    hidden(
      el('rect', {
        class: 'night-sky sky-fade',
        x: 0,
        y: r1(L.sceneH - bgH - 1 + yurtDy),
        width: L.vw,
        height: 70,
        fill: `url(#${ids.skyFade})`,
      }),
    ),
  );
  svg.appendChild(hidden(el('rect', { class: 'night-sky night-veil', x: 0, y: 0, width: L.vw, height: L.height, fill: SHADOW, opacity: 0.25 })));

  svg.appendChild(moonGroup(r1(L.vw / 2), r1(L.bandH * 0.46), r1(Math.min(L.bandH * 0.36, 78)), ids));

  const fearSteps: number[] = [];
  let nearestUsed = false;
  steps.forEach((step, i) => {
    let nearest = false;
    if (!nearestUsed && step.zone === 'block' && reading.nearestBlock !== null && step.text === reading.nearestBlock) {
      nearest = true;
      nearestUsed = true;
    }
    const fearIndex = step.zone === 'fear' ? fearSteps.length : null;
    if (fearIndex !== null) fearSteps.push(i);
    svg.appendChild(stairGroup(step, i, L, nearest, fearIndex));
  });

  if (fearSteps.length === 0) {
    const lines = wrapText(t('noGhosts'), Math.floor((L.vw - 2 * PAD) / charWidth(NOTE_FONT)), 2);
    const none = textBlock(lines, r1(L.vw / 2), 24, NOTE_FONT, MOON, 'middle');
    none.setAttribute('class', 'no-ghosts');
    svg.appendChild(none);
  } else {
    fearSteps.forEach((stepIndex, gi) => {
      const step = steps[stepIndex];
      const fear = step?.text ?? '';
      const ghost: Ghost = ghosts[gi] ?? { fear, step: '' };
      const node = ghostGroup(ghost, gi, stepIndex, step?.number ?? stepIndex + 1, L, ids);
      // Spirits on lower steps stand in front of the ones above.
      const prevGhost = svg.querySelector('.ghost');
      if (prevGhost) svg.insertBefore(node, prevGhost);
      else svg.appendChild(node);
      applyGhostState(svg, node, ghost, gi);
    });
    // The numbers of the fear steps are drawn again over the spirits, so a claw never hides them.
    const top = el('g', { class: 'plate-num-top', 'aria-hidden': 'true' });
    svg.querySelectorAll('.stair[data-fear]').forEach((stair) => {
      const copy = stair.querySelector('.plate-num')?.cloneNode(true) as SVGElement | undefined;
      if (!copy) return;
      copy.setAttribute('class', 'plate-num-over');
      copy.setAttribute('data-fear', stair.getAttribute('data-fear') ?? '');
      top.appendChild(copy);
    });
    svg.appendChild(top);
  }
  return svg;
}

/** Updates spirits, check marks and fear steps in place when a step is written or cleared. */
export function updateGhosts(svg: SVGSVGElement, ghosts: Ghost[]): void {
  ghosts.forEach((g, i) => {
    const root = svg.querySelector(`.ghost[data-ghost="${i}"]`);
    if (root) applyGhostState(svg, root, g, i, true);
  });
}
