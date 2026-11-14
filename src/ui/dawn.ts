import { allFaded, type Ghost } from '../domain/ghosts';

/** The line shown under the staircase (and in the saved picture) at dawn. */
export const DAWN_LINE = 'Morning. Every fear has a next step.';

// Literal colors so the saved PNG matches the screen. Same values as the CSS variables
// --dawn-top, --dawn-bottom and --dawn-text; a test keeps them equal.
export const DAWN_TOP = '#F4B6A6';
export const DAWN_BOTTOM = '#FFD9A0';
export const DAWN_TEXT = '#2A1F3D';

const NS = 'http://www.w3.org/2000/svg';

export type DawnHandle = {
  /** Sits behind the staircase: dawn sky, stars and sun. Decorative, hidden from screen readers. */
  sky: HTMLElement;
  /** The dawn line. Place it after the staircase, inside the same stage. */
  line: HTMLElement;
};

/** True when there is at least one ghost and every ghost has a step. */
export function isDawn(ghosts: Ghost[]): boolean {
  return ghosts.length > 0 && allFaded(ghosts);
}

/** Turns the dawn on or off by toggling the class `dawn` on the result stage. CSS does the rest. */
export function setDawn(stage: Element, on: boolean): void {
  stage.classList.toggle('dawn', on);
}

const STARS: Array<[number, number, number]> = [
  [40, 30, 1.6],
  [120, 70, 1.2],
  [210, 25, 1.8],
  [300, 60, 1.2],
  [390, 20, 1.6],
  [470, 75, 1.2],
  [560, 35, 1.8],
  [630, 80, 1.2],
];

/** Builds the dawn layers. They are inert until `setDawn(stage, true)`. */
export function buildDawn(): DawnHandle {
  const sky = document.createElement('div');
  sky.className = 'dawn-sky';
  sky.setAttribute('aria-hidden', 'true');

  const glow = document.createElement('div');
  glow.className = 'dawn-glow';

  const stars = document.createElementNS(NS, 'svg');
  stars.setAttribute('class', 'dawn-stars');
  stars.setAttribute('viewBox', '0 0 680 100');
  stars.setAttribute('preserveAspectRatio', 'xMidYMin slice');
  stars.setAttribute('focusable', 'false');
  for (const [cx, cy, r] of STARS) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', String(cx));
    c.setAttribute('cy', String(cy));
    c.setAttribute('r', String(r));
    c.setAttribute('fill', '#F4EFE6');
    stars.append(c);
  }

  const sun = document.createElement('div');
  sun.className = 'dawn-sun';

  sky.append(glow, stars, sun);

  const line = document.createElement('p');
  line.className = 'dawn-line';
  line.setAttribute('role', 'status');
  line.textContent = DAWN_LINE;

  return { sky, line };
}
