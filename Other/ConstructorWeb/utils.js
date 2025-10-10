export function fetchConError(url, options) {
  return fetch(url, options).catch(e => console.error(e));
}
