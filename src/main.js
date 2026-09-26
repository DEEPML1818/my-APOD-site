import './styles.css'
import heroImg from './assets/hero.png'

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

// DOM build with Home View and Clean Search Results Page View
const app = document.getElementById('app')
app.innerHTML = `
  <div class="bg" style="background-image: url('${heroImg}')"></div>
  
  <!-- HOME VIEW -->
  <div class="ui" id="homeView">
    <div class="top">
      <div class="clock" id="clock">--:--</div>
      <div class="greet" id="greet">Hello, Explorer</div>
    </div>

    <div class="center" style="position:relative;">
      <div class="searchwrap">
        <input id="q" placeholder="Search the cosmos..." autocomplete="off" />
        <button id="s">Go</button>
      </div>
      <div class="links">
        <a href="https://github.com" target="_blank">GitHub</a>
        <a href="https://youtube.com" target="_blank">YouTube</a>
        <a href="https://reddit.com" target="_blank">Reddit</a>
      </div>
    </div>
  </div>

  <!-- SEARCH RESULTS PAGE VIEW -->
  <div class="results-page" id="resultsView" style="display:none;">
    <header class="search-header">
      <div class="search-top-row">
        <a href="#" class="search-brand-logo" id="brandLogoBtn" title="Back to Home">
          <span class="brand-icon">✦</span>
          <span>Explorer</span>
        </a>
        
        <div class="search-input-box">
          <input id="resultsQ" placeholder="Search the web..." autocomplete="off" />
          <button id="resultsS" class="search-btn-icon" title="Search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <div class="search-header-right">
          <a href="#" class="home-nav-btn" id="backToHomeBtn">← Home</a>
        </div>
      </div>

      <div class="search-tabs-row" id="searchTabs">
        <div class="search-tab active" data-tab="all">All</div>
        <div class="search-tab" data-tab="images">Images</div>
        <div class="search-tab" data-tab="news">News</div>
        <div class="search-tab" data-tab="videos">Videos</div>
      </div>
    </header>

    <div class="search-results-wrap">
      <main class="search-results-main" id="resultsMain">
        <div class="search-stats" id="resultsStats">About 0 results</div>
        <div id="resultsList"></div>
      </main>
    </div>
  </div>

  <!-- APOD INFO PANEL -->
  <div class="infoToggle" id="infoToggle">i</div>
  <div class="infoPanel" id="infoPanel">
    <h2 id="apod-title">Loading...</h2>
    <p id="apod-expl">Please wait while the universe loads.</p>
    <small id="apod-date"></small>
  </div>
`

// clock
function updClock(){
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes()
  const am = h>=12 ? 'PM' : 'AM'
  const hh = ((h+11)%12+1)
  const timeStr = `${hh}:${m.toString().padStart(2,'0')} ${am}`
  
  const homeClock = document.getElementById('clock')
  if (homeClock) homeClock.textContent = timeStr

  const g = h < 12 ? 'Good morning' : (h<18 ? 'Good afternoon' : 'Good evening')
  const greet = document.getElementById('greet')
  if (greet) greet.textContent = `${g}, Explorer`
}
setInterval(updClock,1000)
updClock()

// SerpApi Key Setup
const SERP_API_KEY = import.meta.env.VITE_SERPAPI_KEY || '' // Please set in .env

// State
let currentTab = 'all'
let currentQuery = ''

// View Switching
function showHomeView() {
  document.getElementById('homeView').style.display = 'flex'
  document.getElementById('resultsView').style.display = 'none'
  const homeInput = document.getElementById('q')
  if (homeInput) homeInput.focus()
}

function showResultsView(query) {
  document.getElementById('homeView').style.display = 'none'
  document.getElementById('resultsView').style.display = 'flex'
  const resultsInput = document.getElementById('resultsQ')
  if (resultsInput) {
    resultsInput.value = query
    resultsInput.focus()
  }
}

function extractDomain(urlStr) {
  try {
    const parsed = new URL(urlStr)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return urlStr || 'web'
  }
}

// Search execution across tabs (All, Images, News, Videos)
async function executeSearch(query, tab = currentTab) {
  const q = query.trim()
  if (!q) return

  currentQuery = q
  currentTab = tab
  showResultsView(q)

  // Update tabs UI
  document.querySelectorAll('.search-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === currentTab)
  })

  const resultsMain = document.getElementById('resultsMain')
  const stats = document.getElementById('resultsStats')
  const resultsList = document.getElementById('resultsList')

  if (currentTab === 'images') {
    resultsMain.classList.add('wide-layout')
  } else {
    resultsMain.classList.remove('wide-layout')
  }

  const tabLabels = { all: 'results', images: 'images', news: 'news stories', videos: 'videos' }
  stats.innerHTML = `Searching for <em>${escapeHtml(q)}</em> ${tabLabels[currentTab] || ''}...`
  resultsList.innerHTML = `<div class="search-loading">Searching ${tabLabels[currentTab] || 'the web'}...</div>`

  const startTime = performance.now()

  // Determine SerpApi engine / params based on active tab
  let endpoint = `/search.json?q=${encodeURIComponent(q)}&api_key=${SERP_API_KEY}`
  if (currentTab === 'all') {
    endpoint += '&engine=google'
  } else if (currentTab === 'images') {
    endpoint += '&engine=google_images'
  } else if (currentTab === 'news') {
    endpoint += '&engine=google_news'
  } else if (currentTab === 'videos') {
    endpoint += '&engine=google_videos'
  }

  try {
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error('Network or API error')

    const data = await res.json()
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)

    renderResults(data, q, currentTab, elapsed)
  } catch (err) {
    console.error(err)
    stats.textContent = 'Search failed'
    resultsList.innerHTML = `
      <div class="search-empty" style="color:#f28b82;">
        <p>Error fetching search results.</p>
        <p style="font-size:13px;color:#aaa;margin-top:6px;">Please verify that <code>VITE_SERPAPI_KEY</code> is configured properly in your <code>.env</code> file.</p>
      </div>
    `
  }
}

function renderResults(data, q, tab, elapsed) {
  const stats = document.getElementById('resultsStats')
  const resultsList = document.getElementById('resultsList')

  if (tab === 'all') {
    const items = data.organic_results || []
    if (items.length > 0) {
      stats.textContent = `About ${items.length} results (${elapsed} seconds)`
      resultsList.innerHTML = items.map(item => {
        const domain = extractDomain(item.link || '')
        const displayUrl = item.displayed_link || item.link || ''
        const initial = domain.charAt(0).toUpperCase() || '✦'

        return `
          <div class="search-result-item">
            <div class="result-source">
              <div class="source-icon">${initial}</div>
              <div class="source-meta">
                <span class="source-name">${escapeHtml(domain)}</span>
                <span class="source-url">${escapeHtml(displayUrl)}</span>
              </div>
            </div>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="result-heading-link">${escapeHtml(item.title || '')}</a>
            <p class="result-snippet-text">${escapeHtml(item.snippet || '')}</p>
          </div>
        `
      }).join('')
    } else {
      renderEmpty(q, elapsed)
    }
  } else if (tab === 'images') {
    const items = data.images_results || []
    if (items.length > 0) {
      stats.textContent = `About ${items.length} images (${elapsed} seconds)`
      resultsList.innerHTML = `
        <div class="images-grid">
          ${items.map(img => {
            const thumbUrl = img.thumbnail || img.original || ''
            const sourceUrl = img.link || img.original || '#'
            const sourceDomain = extractDomain(sourceUrl)
            return `
              <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="image-card" title="${escapeHtml(img.title || '')}">
                <div class="image-thumb-wrap">
                  <img src="${thumbUrl}" alt="${escapeHtml(img.title || 'Image')}" loading="lazy" />
                </div>
                <div class="image-card-info">
                  <span class="image-card-title">${escapeHtml(img.title || 'Untitled Image')}</span>
                  <span class="image-card-source">${escapeHtml(img.source || sourceDomain)}</span>
                </div>
              </a>
            `
          }).join('')}
        </div>
      `
    } else {
      renderEmpty(q, elapsed)
    }
  } else if (tab === 'news') {
    const items = data.news_results || []
    if (items.length > 0) {
      stats.textContent = `About ${items.length} news stories (${elapsed} seconds)`
      resultsList.innerHTML = items.map(news => {
        const sourceName = typeof news.source === 'object' ? (news.source.name || '') : (news.source || '')
        const dateStr = news.date || ''
        const thumbUrl = news.thumbnail || ''

        return `
          <div class="news-item">
            <div class="news-content">
              <div class="news-source-row">
                <span class="news-source-name">${escapeHtml(sourceName || 'News')}</span>
                ${dateStr ? `<span>•</span><span>${escapeHtml(dateStr)}</span>` : ''}
              </div>
              <a href="${news.link}" target="_blank" rel="noopener noreferrer" class="news-title-link">${escapeHtml(news.title || '')}</a>
              <p class="news-snippet">${escapeHtml(news.snippet || '')}</p>
            </div>
            ${thumbUrl ? `<img src="${thumbUrl}" alt="Thumbnail" class="news-thumb" loading="lazy" />` : ''}
          </div>
        `
      }).join('')
    } else {
      renderEmpty(q, elapsed)
    }
  } else if (tab === 'videos') {
    const items = data.video_results || data.videos_results || []
    if (items.length > 0) {
      stats.textContent = `About ${items.length} videos (${elapsed} seconds)`
      resultsList.innerHTML = items.map(video => {
        const thumbUrl = video.thumbnail || ''
        const duration = video.duration || ''
        const channel = video.channel || video.source || ''
        const dateStr = video.uploaded_date || video.date || ''

        return `
          <div class="video-item">
            <div class="video-thumb-container">
              ${thumbUrl ? `<img src="${thumbUrl}" alt="${escapeHtml(video.title || 'Video')}" loading="lazy" />` : ''}
              ${duration ? `<span class="video-duration">${escapeHtml(duration)}</span>` : ''}
            </div>
            <div class="video-details">
              <a href="${video.link}" target="_blank" rel="noopener noreferrer" class="video-title-link">${escapeHtml(video.title || '')}</a>
              <div class="video-meta-row">
                <span>${escapeHtml(channel || 'Video')}</span>
                ${dateStr ? `<span> • ${escapeHtml(dateStr)}</span>` : ''}
              </div>
              <p class="video-snippet">${escapeHtml(video.snippet || '')}</p>
            </div>
          </div>
        `
      }).join('')
    } else {
      renderEmpty(q, elapsed)
    }
  }
}

function renderEmpty(q, elapsed) {
  const stats = document.getElementById('resultsStats')
  const resultsList = document.getElementById('resultsList')
  stats.textContent = `About 0 results (${elapsed} seconds)`
  resultsList.innerHTML = `
    <div class="search-empty">
      <p>Your search - <strong>${escapeHtml(q)}</strong> - did not match any documents.</p>
      <p style="margin-top:12px;font-size:13px;color:#8899aa;">Suggestions:<br>• Make sure all words are spelled correctly.<br>• Try different keywords.<br>• Try more general keywords.</p>
    </div>
  `
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Tab Switching Listener
document.getElementById('searchTabs').addEventListener('click', (e) => {
  const tabTarget = e.target.closest('.search-tab')
  if (!tabTarget) return
  const selectedTab = tabTarget.dataset.tab
  if (selectedTab && selectedTab !== currentTab) {
    executeSearch(currentQuery || document.getElementById('resultsQ').value, selectedTab)
  }
})

// Home Search Listeners
document.getElementById('s').addEventListener('click', () => {
  const q = document.getElementById('q').value
  executeSearch(q, 'all')
})

document.getElementById('q').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    executeSearch(e.target.value, 'all')
  }
})

// Results Page Search Listeners
document.getElementById('resultsS').addEventListener('click', () => {
  const q = document.getElementById('resultsQ').value
  executeSearch(q, currentTab)
})

document.getElementById('resultsQ').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    executeSearch(e.target.value, currentTab)
  }
})

// Navigation to Home
document.getElementById('brandLogoBtn').addEventListener('click', (e) => {
  e.preventDefault()
  showHomeView()
})

document.getElementById('backToHomeBtn').addEventListener('click', (e) => {
  e.preventDefault()
  showHomeView()
})

// Info toggle
document.getElementById('infoToggle').addEventListener('click', () => {
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
