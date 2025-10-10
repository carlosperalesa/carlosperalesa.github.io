import { fetchConError } from './utils.js';

document.querySelectorAll("button[title='galeria']").forEach(btn => {
  btn.addEventListener('click', async () => {
    const res = await fetchConError('/componente/galeria');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
  });
});
