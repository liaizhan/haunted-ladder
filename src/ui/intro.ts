const NS = 'http://www.w3.org/2000/svg';

function svgEl(name: string, attrs: Record<string, string | number> = {}): SVGElement {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

// Fixed star positions (x, y, radius) in a 360 x 420 scene, so the picture is always the same.
const STARS: Array<[number, number, number]> = [
  [24, 30, 1.2],
  [60, 88, 1],
  [96, 22, 1.4],
  [140, 64, 1],
  [188, 34, 1.2],
  [226, 96, 1],
  [262, 20, 1.3],
  [300, 70, 1],
  [334, 28, 1.2],
  [20, 140, 1],
  [118, 130, 1.1],
  [210, 150, 1],
  [330, 130, 1.2],
  [46, 196, 1],
  [286, 190, 1],
  [160, 106, 0.9],
];

/** The night scene: moon with halo, stars, a ladder rising from low fog, a small ghost peeking. */
function buildScene(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'intro-scene-svg',
    viewBox: '0 0 360 420',
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'xMidYMax slice',
    focusable: 'false',
    'aria-hidden': 'true',
  }) as SVGSVGElement;

  const defs = svgEl('defs');
  const halo = svgEl('radialGradient', { id: 'intro-halo', cx: '50%', cy: '50%', r: '50%' });
  halo.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#F4EFE6', 'stop-opacity': 0.5 }),
    svgEl('stop', { offset: '45%', 'stop-color': '#A9A3C7', 'stop-opacity': 0.2 }),
    svgEl('stop', { offset: '100%', 'stop-color': '#A9A3C7', 'stop-opacity': 0 }),
  );
  const fogGrad = svgEl('linearGradient', { id: 'intro-fog-grad', x1: 0, y1: 0, x2: 0, y2: 1 });
  fogGrad.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#A9A3C7', 'stop-opacity': 0 }),
    svgEl('stop', { offset: '100%', 'stop-color': '#A9A3C7', 'stop-opacity': 0.35 }),
  );
  defs.append(halo, fogGrad);
  svg.append(defs);

  svg.append(svgEl('rect', { x: 0, y: 0, width: 360, height: 420, fill: '#14112B' }));

  const stars = svgEl('g', { class: 'intro-stars', fill: '#F4EFE6', opacity: 0.8 });
  for (const [cx, cy, r] of STARS) stars.append(svgEl('circle', { cx, cy, r }));
  svg.append(stars);

  svg.append(
    svgEl('circle', { class: 'intro-halo', cx: 268, cy: 92, r: 110, fill: 'url(#intro-halo)' }),
    svgEl('circle', { class: 'intro-moon', cx: 268, cy: 92, r: 34, fill: '#F4EFE6', opacity: 0.92 }),
  );

  // Ladder silhouette: two rails leaning toward the moon, rungs between them.
  const ladder = svgEl('g', {
    class: 'intro-ladder',
    stroke: '#221C45',
    'stroke-width': 5,
    'stroke-linecap': 'round',
    fill: 'none',
  });
  ladder.append(svgEl('path', { d: 'M110 420 L200 150' }), svgEl('path', { d: 'M160 420 L230 160' }));
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    const y = 400 - t * 240;
    const xl = 110 + (420 - y) * (90 / 270);
    const xr = 160 + (420 - y) * (70 / 260);
    ladder.append(svgEl('path', { d: `M${xl.toFixed(1)} ${y.toFixed(1)} L${xr.toFixed(1)} ${y.toFixed(1)}` }));
  }
  svg.append(ladder);

  // One small ghost peeking from behind the left rail.
  const ghost = svgEl('g', { class: 'intro-ghost', transform: 'translate(104 300)', opacity: 0.85 });
  ghost.append(
    svgEl('path', {
      d: 'M-16 0 C-16 -22 -8 -30 0 -30 C8 -30 16 -22 16 0 L16 16 L10 11 L5 16 L0 11 L-5 16 L-10 11 L-16 16 Z',
      fill: '#F4EFE6',
      'fill-opacity': 0.8,
    }),
    svgEl('circle', { cx: -5, cy: -14, r: 2.2, fill: '#221C45' }),
    svgEl('circle', { cx: 5, cy: -14, r: 2.2, fill: '#221C45' }),
  );
  svg.append(ghost);
  // The rail passes in front of the ghost.
  svg.append(
    svgEl('path', {
      d: 'M110 420 L200 150',
      stroke: '#221C45',
      'stroke-width': 5,
      'stroke-linecap': 'round',
      fill: 'none',
    }),
  );

  svg.append(
    svgEl('rect', { class: 'intro-fog', x: 0, y: 290, width: 360, height: 130, fill: 'url(#intro-fog-grad)' }),
  );
  return svg;
}

/**
 * The intro screen: a night scene behind a flickering title, a short explanation, a "Start"
 * button and a link to the sample ladder. No price, no sign-in, no external file.
 */
export function createIntro(onStart: () => void): HTMLElement {
  const root = document.createElement('section');
  root.className = 'screen intro';

  const scene = document.createElement('div');
  scene.className = 'intro-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.append(buildScene());

  const content = document.createElement('div');
  content.className = 'intro-content';

  const title = document.createElement('h1');
  title.className = 'flicker';
  title.textContent = 'Haunted Ladder';

  const p1 = document.createElement('p');
  p1.textContent =
    'A gentle, spooky self-check built on the Ladder method by Aizhan Li. ' +
    'Write your goal, where you are now, what stands in the way and what scares you. ' +
    'Your fears become ghosts you can see, name and make fade.';
  const p2 = document.createElement('p');
  p2.textContent = 'It takes a few minutes. Your words stay in your browser.';

  const actions = document.createElement('div');
  actions.className = 'intro-actions';
  const start = document.createElement('button');
  start.type = 'button';
  start.textContent = 'Start';
  start.addEventListener('click', onStart);
  const sample = document.createElement('a');
  sample.className = 'button secondary';
  sample.href = '?demo=1';
  sample.textContent = 'See a sample ladder';
  actions.append(start, sample);

  content.append(title, p1, p2, actions);
  root.append(scene, content);
  return root;
}
