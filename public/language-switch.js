// Real links remain crawlable and work without JavaScript. Carry current clues
// on activation, including values the visitor has not submitted yet.
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-language]');
  if (!link) return;
  const destination = new URL(link.href);
  const query = new URLSearchParams(location.search);
  for (const id of ['average', 'bid', 'tolerance', 'margin', 'sort']) {
    const input = document.getElementById(id);
    if (input?.value) query.set(id, input.value);
  }
  const gold = document.getElementById('goldForm');
  if (gold) for (const input of gold.elements) {
    if (/^item\d+$/.test(input.name) && Number(input.value)===0) query.delete(input.name);
    else if (/^(target|maxPerItem|maxCount|maxSlots|maxResults|item\d+)$/.test(input.name) && input.value) query.set(input.name, input.value);
  }
  destination.search = query.toString();
  destination.hash = location.hash;
  link.href = destination.href;
});
