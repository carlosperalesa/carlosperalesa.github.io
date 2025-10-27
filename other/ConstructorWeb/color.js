import { fetchConError } from './utils.js';

document.querySelectorAll("button[title='color']").forEach(btn => {
  btn.addEventListener('click', async () => {
    const res = await fetchConError('/componente/color');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
  });
});
