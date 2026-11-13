import './styles.css';

const app = document.getElementById('app');

if (app) {
  const title = document.createElement('h1');
  title.textContent = 'Haunted Ladder';
  app.append(title);
}
