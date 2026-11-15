import { t } from '../i18n';
import { artUrl, type ArtName } from './art';

/** A decorative picture from public/art, hidden from screen readers. */
function art(name: ArtName, className: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = artUrl(name);
  img.alt = '';
  img.className = className;
  img.decoding = 'async';
  img.setAttribute('aria-hidden', 'true');
  return img;
}

/**
 * The night scene of the result page in small: the mirrored steppe with the yurt, the blood moon,
 * golden carpet steps rising toward it, fog. The three Zheztyrnaq of fear steps 6, 7 and 8 come off
 * the stairs toward the viewer, as on the project cover, and a flash of lightning sends them back.
 */
function buildScene(): HTMLElement {
  const scene = document.createElement('div');
  scene.className = 'intro-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.append(art('steppe-night', 'intro-bg'));
  const moon = document.createElement('div');
  moon.className = 'intro-moon';
  scene.append(moon);
  const steps = document.createElement('div');
  steps.className = 'intro-steps';
  for (let i = 0; i < 5; i++) {
    const step = art('step', 'intro-step');
    step.style.setProperty('--i', String(i));
    steps.append(step);
    if (i < 4) {
      const star = art('star', 'intro-star');
      star.style.setProperty('--i', String(i));
      steps.append(star);
    }
  }
  scene.append(steps);
  const spirits: ArtName[] = ['zheztyrnaq-crawl', 'zheztyrnaq-peek', 'zheztyrnaq-rise'];
  spirits.forEach((name, i) => scene.append(art(name, `intro-spirit intro-spirit-${i + 1}`)));
  const flash = document.createElement('div');
  flash.className = 'intro-flash';
  scene.append(flash);
  const fog = document.createElement('div');
  fog.className = 'intro-fog';
  scene.append(fog);
  return scene;
}

/**
 * The title in two moods: "Haunted" trembles red like fear, the letters of "Ladder" stand on a rising
 * baseline like steps and light up gold one by one from the bottom. The text stays "Haunted Ladder".
 */
function createTitle(): HTMLElement {
  const title = document.createElement('h1');
  title.className = 'flicker';
  const haunted = document.createElement('span');
  haunted.className = 'title-haunted';
  haunted.textContent = 'Haunted';
  const ladder = document.createElement('span');
  ladder.className = 'title-ladder';
  [...'Ladder'].forEach((ch, i) => {
    const letter = document.createElement('span');
    letter.className = 'title-letter';
    letter.style.setProperty('--i', String(i));
    letter.textContent = ch;
    ladder.append(letter);
  });
  title.append(haunted, ' ', ladder);
  return title;
}

/**
 * A taste of calm before the first step: while the "Start" button is hovered, focused or held, the
 * moon turns gold and its beat slows, the three Zheztyrnaq sink into the fog. Letting go brings the night back.
 */
function previewCalm(root: HTMLElement, button: HTMLButtonElement): void {
  const on = (): void => root.classList.add('preview-calm');
  const off = (): void => root.classList.remove('preview-calm');
  for (const type of ['pointerenter', 'pointerdown', 'focus']) button.addEventListener(type, on);
  for (const type of ['pointerleave', 'pointercancel', 'blur']) button.addEventListener(type, off);
}

/**
 * The intro screen: a night scene behind a flickering title, a tagline, a short explanation, a "Start"
 * button and a link to the sample ladder. No price, no sign-in, no external file.
 */
export function createIntro(onStart: () => void): HTMLElement {
  const root = document.createElement('section');
  root.className = 'screen intro';

  const scene = buildScene();

  const content = document.createElement('div');
  content.className = 'intro-content';

  const title = createTitle();

  const tagline = document.createElement('p');
  tagline.className = 'intro-tagline';
  tagline.textContent = t('introTagline');
  const p1 = document.createElement('p');
  p1.textContent = t('introP1');
  const p2 = document.createElement('p');
  p2.className = 'intro-note';
  p2.textContent = t('introP2');

  const actions = document.createElement('div');
  actions.className = 'intro-actions';
  const start = document.createElement('button');
  start.type = 'button';
  start.textContent = t('introStart');
  start.addEventListener('click', onStart);
  previewCalm(root, start);
  const sample = document.createElement('a');
  sample.className = 'button secondary';
  sample.href = '?demo=1';
  sample.textContent = t('introSample');
  actions.append(start, sample);

  content.append(title, tagline, p1, p2, actions);
  root.append(scene, content);
  return root;
}
