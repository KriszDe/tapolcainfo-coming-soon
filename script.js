
function toggleMode(){
  document.documentElement.classList.toggle('dark');
}
function ok(){
  const p = document.querySelector('.ok');
  if(p) p.hidden = false;
}
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 60);
function updateCountdown(){
  const now = new Date();
  let diff = Math.max(0, targetDate - now);
  const d = Math.floor(diff / (1000*60*60*24)); diff -= d*(1000*60*60*24);
  const h = Math.floor(diff / (1000*60*60)); diff -= h*(1000*60*60);
  const m = Math.floor(diff / (1000*60)); diff -= m*(1000*60);
  const s = Math.floor(diff / 1000);
  document.getElementById('d').textContent = String(d);
  document.getElementById('h').textContent = String(h).padStart(2,'0');
  document.getElementById('m').textContent = String(m).padStart(2,'0');
  document.getElementById('s').textContent = String(s).padStart(2,'0');
}
setInterval(updateCountdown, 1000);
updateCountdown();
