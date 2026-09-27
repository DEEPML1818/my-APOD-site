export function initClock() {
  function updClock() {
    const d = new Date()
    const h = d.getHours()
    const m = d.getMinutes()
    const am = h >= 12 ? 'PM' : 'AM'
    const hh = ((h + 11) % 12 + 1)
    const timeStr = `${hh}:${m.toString().padStart(2, '0')} ${am}`

    const homeClock = document.getElementById('clock')
    if (homeClock) homeClock.textContent = timeStr

    const g = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening')
    const greet = document.getElementById('greet')
    if (greet) greet.textContent = `${g}, Explorer`
  }

  setInterval(updClock, 1000)
  updClock()
}
