import './styles.css'

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

// sloppy DOM build
const app = document.getElementById('app')
app.innerHTML = `
  <div class="bg"></div>
  <div class="ui">
    <div class="top">
      <div class="clock" id="clock">--:--</div>
      <div class="greet" id="greet">Hello, Explorer</div>
    </div>

    <div class="center">
      <div class="searchwrap">
        <input id="q" placeholder="Search the web..." />
        <button id="s">Go</button>
      </div>
      <div class="links">
        <a href="https://github.com" target="_blank">GitHub</a>
        <a href="https://youtube.com" target="_blank">YouTube</a>
        <a href="https://reddit.com" target="_blank">Reddit</a>
      </div>
    </div>

    <div class="infoToggle" id="infoToggle">i</div>
    <div class="infoPanel" id="infoPanel">
      <h2 id="apod-title">Loading...</h2>
      <p id="apod-expl">Please wait while the universe loads.</p>
      <small id="apod-date"></small>
    </div>
  </div>
`

// clock
function updClock(){
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes()
  const am = h>=12 ? 'PM' : 'AM'
  const hh = ((h+11)%12+1)
  document.getElementById('clock').textContent = `${hh}:${m.toString().padStart(2,'0')} ${am}`
  const g = hh < 12 ? 'Good morning' : (hh<6 ? 'Good afternoon' : 'Good evening')
  document.getElementById('greet').textContent = `${g}, Explorer`
}
setInterval(updClock,1000)
updClock()

// search
document.getElementById('s').addEventListener('click', ()=>{
  const q = document.getElementById('q').value.trim()
  if(!q) return window.open('https://google.com', '_blank')
  window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank')
})

// info toggle
document.getElementById('infoToggle').addEventListener('click', ()=>{
  document.getElementById('infoPanel').classList.toggle('open')
})

// APOD fetch with simple cache
async function fetchAPOD(){
  try{
    const cached = localStorage.getItem('apod_cache')
    if(cached){
      const obj = JSON.parse(cached)
      const today = new Date().toISOString().slice(0,10)
      if(obj.date === today){
        applyAPOD(obj)
        return
      }
    }

    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`)
    const data = await res.json()
    localStorage.setItem('apod_cache', JSON.stringify(data))
    applyAPOD(data)
  }catch(e){
    console.warn('apod fail', e)
    applyFallback()
  }
}

function applyAPOD(d){
  const url = d.hdurl || d.url || '/src/assets/hero.png'
  document.querySelector('.bg').style.backgroundImage = `url(${url})`
  document.getElementById('apod-title').textContent = d.title || 'Untitled'
  document.getElementById('apod-expl').textContent = d.explanation || ''
  document.getElementById('apod-date').textContent = d.date || ''
}

function applyFallback(){
  const url = '/src/assets/hero.png'
  document.querySelector('.bg').style.backgroundImage = `url(${url})`
  document.getElementById('apod-title').textContent = 'Fallback Image'
  document.getElementById('apod-expl').textContent = 'Could not fetch NASA APOD. Using local image.'
}

fetchAPOD()

// tiny responsiveness messy
window.addEventListener('resize', ()=>{
  const w = window.innerWidth
  if(w<600) document.body.classList.add('small')
  else document.body.classList.remove('small')
})
