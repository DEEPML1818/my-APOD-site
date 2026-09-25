import './styles.css'
import heroImg from './assets/hero.png'

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

// sloppy DOM build
const app = document.getElementById('app')
app.innerHTML = `
  <div class="bg" style="background-image: url('${heroImg}')"></div>
  <div class="ui">
    <div class="top">
      <div class="clock" id="clock">--:--</div>
      <div class="greet" id="greet">Hello, Explorer</div>
    </div>

    <div class="center" style="position:relative;">
      <div class="searchwrap">
        <input id="q" placeholder="Search the web with SerpApi..." />
        <button id="s">Go</button>
      </div>
      <div class="links">
        <a href="https://github.com" target="_blank">GitHub</a>
        <a href="https://youtube.com" target="_blank">YouTube</a>
        <a href="https://reddit.com" target="_blank">Reddit</a>
      </div>
      
      <div class="resultsPanel" id="resultsPanel" style="display:none;">
        <div class="results-header">
          <h3>Search Results</h3>
          <button id="closeResults" class="close-btn">&times;</button>
        </div>
        <div id="resultsContent"></div>
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
  const g = h < 12 ? 'Good morning' : (h<18 ? 'Good afternoon' : 'Good evening')
  document.getElementById('greet').textContent = `${g}, Explorer`
}
setInterval(updClock,1000)
updClock()

// SerpApi Key Setup
const SERP_API_KEY = import.meta.env.VITE_SERPAPI_KEY || '' // Please set in .env

// search
document.getElementById('s').addEventListener('click', async ()=>{
  const q = document.getElementById('q').value.trim()
  if(!q) return
  
  const resultsPanel = document.getElementById('resultsPanel')
  const content = document.getElementById('resultsContent')
  
  resultsPanel.style.display = 'block'
  content.innerHTML = '<p style="color:#aaa;">Searching...</p>'
  
  try {
    const res = await fetch(`/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${SERP_API_KEY}`)
    if (!res.ok) throw new Error('Network or API error')
    
    const data = await res.json()
    
    if (data.organic_results && data.organic_results.length > 0) {
      content.innerHTML = data.organic_results.slice(0, 5).map(item => `
        <div class="result-item">
          <a href="${item.link}" target="_blank" class="result-title">${item.title}</a>
          <p class="result-snippet">${item.snippet || ''}</p>
        </div>
      `).join('')
    } else {
      content.innerHTML = '<p>No results found.</p>'
    }
  } catch (err) {
    console.error(err)
    content.innerHTML = '<p style="color:#ff6b6b;">Error fetching results. Did you configure VITE_SERPAPI_KEY in .env?</p>'
  }
})

document.getElementById('closeResults').addEventListener('click', () => {
  document.getElementById('resultsPanel').style.display = 'none'
})

// info toggle
document.getElementById('infoToggle').addEventListener('click', ()=>{
  document.getElementById('infoPanel').classList.toggle('open')
})

// APOD fetch with simple cache
async function fetchAPOD(){
  try{
    const cached = localStorage.getItem('apod_cache_v2')
    if(cached){
      const obj = JSON.parse(cached)
      const today = new Date().toISOString().slice(0,10)
      if(obj.date === today){
        applyAPOD(obj)
        return
      }
    }

    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&thumbs=true`)
    const data = await res.json()
    localStorage.setItem('apod_cache_v2', JSON.stringify(data))
    applyAPOD(data)
  }catch(e){
    console.warn('apod fail', e)
    applyFallback()
  }
}

function applyAPOD(d){
  // Prioritize web-optimized d.url (1024px) over huge multi-megabyte d.hdurl
  let targetUrl = heroImg
  if (d.media_type === 'video' && d.thumbnail_url) {
    targetUrl = d.thumbnail_url
  } else if (d.url || d.hdurl) {
    targetUrl = d.url || d.hdurl
  }

  // Preload image so we don't display a broken/empty state while downloading
  const img = new Image()
  img.referrerPolicy = 'no-referrer'
  img.onload = () => {
    const bg = document.querySelector('.bg')
    if (bg) bg.style.backgroundImage = `url('${targetUrl}')`
  }
  img.onerror = () => {
    console.warn('NASA image failed to load, falling back to hdurl or local hero')
    if (d.hdurl && targetUrl !== d.hdurl) {
      const fallbackImg = new Image()
      fallbackImg.referrerPolicy = 'no-referrer'
      fallbackImg.onload = () => {
        const bg = document.querySelector('.bg')
        if (bg) bg.style.backgroundImage = `url('${d.hdurl}')`
      }
      fallbackImg.onerror = () => applyFallback()
      fallbackImg.src = d.hdurl
    } else {
      applyFallback()
    }
  }
  img.src = targetUrl

  document.getElementById('apod-title').textContent = d.title || 'Untitled'
  document.getElementById('apod-expl').textContent = d.explanation || ''
  document.getElementById('apod-date').textContent = d.date || ''
}

function applyFallback(){
  const bg = document.querySelector('.bg')
  if (bg) bg.style.backgroundImage = `url('${heroImg}')`
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
