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
          <button id="clearSearchBtn" class="clear-btn" style="display:none;" title="Clear">✕</button>
          <div class="search-divider"></div>
          <button id="resultsS" class="search-btn-icon" title="Search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <div class="search-header-right">
          <a href="#" class="home-nav-btn" id="backToHomeBtn">
            <span>←</span> Home
          </a>
        </div>
      </div>

      <div class="search-tabs-row" id="searchTabs">
        <div class="search-tab active" data-tab="all">✦ All</div>
        <div class="search-tab" data-tab="images">🖼 Images</div>
        <div class="search-tab" data-tab="news">📰 News</div>
        <div class="search-tab" data-tab="videos">🎥 Videos</div>
      </div>
    </header>

    <div class="search-results-wrap" id="resultsWrap">
      <main class="search-results-main" id="resultsMain">
        <div class="search-stats" id="resultsStats">About 0 results</div>
        <div id="resultsList"></div>
      </main>
      <aside class="search-sidebar" id="resultsSidebar" style="display:none;"></aside>
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

// SerpApi Key Setup
const SERP_API_KEY = import.meta.env.VITE_SERPAPI_KEY || '' // Please set in .env

// Query Cache to hold all data from single fetch
const queryCache = {
  query: '',
  elapsed: '0.00',
  data: null,
  tabData: {} // tab -> data
}

let currentTab = 'all'

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
    document.getElementById('clearSearchBtn').style.display = query ? 'block' : 'none'
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

// Master search function: single call pulls organic, knowledge graph, images, news, and videos
async function executeSearch(query, tab = 'all', forceTabFetch = false) {
  const q = query.trim()
  if (!q) return

  currentTab = tab
  showResultsView(q)

  // Update tabs UI
  document.querySelectorAll('.search-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === currentTab)
  })

  const resultsMain = document.getElementById('resultsMain')
  const sidebar = document.getElementById('resultsSidebar')
  const stats = document.getElementById('resultsStats')
  const resultsList = document.getElementById('resultsList')

  // If query changed, clear cache
  if (queryCache.query !== q) {
    queryCache.query = q
    queryCache.data = null
    queryCache.tabData = {}
  }

  // If we already have the data in cache and don't need a dedicated extra engine fetch
  if (queryCache.data && !forceTabFetch) {
    renderTab(currentTab)
    return
  }

  stats.innerHTML = `Searching the universe for <em>${escapeHtml(q)}</em>...`
  resultsList.innerHTML = `<div class="search-loading">Fetching results...</div>`
  sidebar.style.display = 'none'

  const startTime = performance.now()

  // Single standard call to Google engine
  const endpoint = `/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${SERP_API_KEY}`

  try {
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error('Network or API error')

    const data = await res.json()
    queryCache.elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
    queryCache.data = data
    queryCache.tabData['all'] = data

    renderTab(currentTab)
  } catch (err) {
    console.error(err)
    stats.textContent = 'Search failed'
    resultsList.innerHTML = `
      <div class="search-empty" style="color:#f28b82;">
        <p>Error fetching search results.</p>
        <p style="font-size:13px;color:#aaa;margin-top:6px;">Please verify that <code>VITE_SERPAPI_KEY</code> is configured properly in your <code>.env</code> file.</p>
      </div>
    `
    sidebar.style.display = 'none'
  }
}

// Render selected tab from cached master data (or dedicated engine if tab clicked)
async function renderTab(tab) {
  const data = queryCache.data || {}
  const q = queryCache.query
  const elapsed = queryCache.elapsed
  const stats = document.getElementById('resultsStats')
  const resultsList = document.getElementById('resultsList')
  const resultsMain = document.getElementById('resultsMain')
  const sidebar = document.getElementById('resultsSidebar')

  if (tab === 'all') {
    resultsMain.classList.remove('wide-layout')
    const items = data.organic_results || []
    const kg = data.knowledge_graph
    const inlineImages = data.inline_images || []

    // Render Knowledge Graph Sidebar if present
    if (kg && (kg.title || kg.description)) {
      sidebar.style.display = 'block'
      const kgImg = kg.header_images && kg.header_images[0] ? kg.header_images[0].image : (kg.image || '')
      sidebar.innerHTML = `
        <div class="knowledge-panel">
          ${kgImg ? `<img src="${kgImg}" alt="${escapeHtml(kg.title || '')}" class="knowledge-header-img" onerror="this.style.display='none'" />` : ''}
          <div class="knowledge-body">
            <h3 class="knowledge-title">${escapeHtml(kg.title || '')}</h3>
            ${kg.type ? `<div class="knowledge-subtitle">${escapeHtml(kg.type)}</div>` : ''}
            ${kg.description ? `<p class="knowledge-desc">${escapeHtml(kg.description)}</p>` : ''}
            ${kg.source && kg.source.link ? `<a href="${kg.source.link}" target="_blank" class="result-heading-link" style="font-size:13px;">Read on ${escapeHtml(kg.source.name || 'Source')} →</a>` : ''}
          </div>
        </div>
      `
    } else {
      sidebar.style.display = 'none'
    }

    if (items.length > 0) {
      stats.textContent = `About ${items.length} results (${elapsed} seconds)`

      // Optional inline image strip at top if Google returned images
      let inlineImgHtml = ''
      if (inlineImages.length > 0) {
        inlineImgHtml = `
          <div class="inline-media-strip">
            <div class="strip-header">
              <span>🖼 Image Highlights</span>
            </div>
            <div class="strip-images-row">
              ${inlineImages.slice(0, 6).map(img => `
                <a href="${img.link || img.original || '#'}" target="_blank" class="strip-img-item" title="${escapeHtml(img.title || '')}">
                  <img src="${img.thumbnail || img.original || ''}" alt="Image" loading="lazy" />
                </a>
              `).join('')}
            </div>
          </div>
        `
      }

      resultsList.innerHTML = inlineImgHtml + items.map(item => {
        const domain = extractDomain(item.link || '')
        const displayUrl = item.displayed_link || item.link || ''
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

        return `
          <div class="search-result-item">
            <div class="result-source">
              <div class="source-icon">
                <img src="${faviconUrl}" alt="${escapeHtml(domain)}" onerror="this.onerror=null; this.parentElement.textContent='✦';" />
              </div>
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
    sidebar.style.display = 'none'
    resultsMain.classList.add('wide-layout')

    // Check if we already have dedicated google_images or inline_images
    let items = queryCache.tabData['images']?.images_results || data.inline_images || []

    // If only had a few inline images or none, fetch dedicated image engine
    if (!queryCache.tabData['images']) {
      stats.innerHTML = `Fetching images for <em>${escapeHtml(q)}</em>...`
      try {
        const res = await fetch(`/search.json?engine=google_images&q=${encodeURIComponent(q)}&api_key=${SERP_API_KEY}`)
        if (res.ok) {
          const imgData = await res.json()
          queryCache.tabData['images'] = imgData
          items = imgData.images_results || []
        }
      } catch (e) {
        console.warn('Image engine fetch fallback to inline images', e)
      }
    } else {
      items = queryCache.tabData['images'].images_results || []
    }

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
    sidebar.style.display = 'none'
    resultsMain.classList.remove('wide-layout')

    let items = queryCache.tabData['news']?.news_results || data.top_stories || []

    if (!queryCache.tabData['news']) {
      stats.innerHTML = `Fetching news stories for <em>${escapeHtml(q)}</em>...`
      try {
        const res = await fetch(`/search.json?engine=google_news&q=${encodeURIComponent(q)}&api_key=${SERP_API_KEY}`)
        if (res.ok) {
          const newsData = await res.json()
          queryCache.tabData['news'] = newsData
          items = newsData.news_results || []
        }
      } catch (e) {
        console.warn('News engine fetch fallback to top_stories', e)
      }
    } else {
      items = queryCache.tabData['news'].news_results || []
    }

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
    sidebar.style.display = 'none'
    resultsMain.classList.remove('wide-layout')

    let items = queryCache.tabData['videos']?.video_results || data.inline_videos || []

    if (!queryCache.tabData['videos']) {
      stats.innerHTML = `Fetching videos for <em>${escapeHtml(q)}</em>...`
      try {
        const res = await fetch(`/search.json?engine=google_videos&q=${encodeURIComponent(q)}&api_key=${SERP_API_KEY}`)
        if (res.ok) {
          const vidData = await res.json()
          queryCache.tabData['videos'] = vidData
          items = vidData.video_results || []
        }
      } catch (e) {
        console.warn('Video engine fetch fallback to inline_videos', e)
      }
    } else {
      items = queryCache.tabData['videos'].video_results || []
    }

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
    currentTab = selectedTab
    document.querySelectorAll('.search-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === currentTab)
    })
    renderTab(selectedTab)
  }
})

// Clear Button
const clearBtn = document.getElementById('clearSearchBtn')
const resultsInput = document.getElementById('resultsQ')

resultsInput.addEventListener('input', () => {
  clearBtn.style.display = resultsInput.value ? 'block' : 'none'
})

clearBtn.addEventListener('click', () => {
  resultsInput.value = ''
  clearBtn.style.display = 'none'
  resultsInput.focus()
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

resultsInput.addEventListener('keydown', (e) => {
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

// APOD fetch: Loads a new random NASA astronomy picture on every refresh
const CURATED_COSMIC_FALLBACKS = [
  {
    title: "The Pillars of Creation (Eagle Nebula)",
    explanation: "Captured in exquisite detail by the James Webb Space Telescope and Hubble, towering tendrils of cosmic dust and gas incubate newborn stars light-years across.",
    date: "1995-11-02",
    url: heroImg
  },
  {
    title: "The Carina Nebula: Cosmic Cliffs",
    explanation: "This landscape of 'mountains' and 'valleys' speckled with glittering stars is actually the edge of a nearby, young, star-forming region NGC 3324 in the Carina Nebula.",
    date: "2022-07-12",
    url: "https://images-assets.nasa.gov/image/PIA25430/PIA25430~orig.jpg"
  },
  {
    title: "The Ring Nebula (M57)",
    explanation: "A dying star's glowing shroud, the Ring Nebula reveals intricate structures formed during the star's final evolutionary stages in vivid deep space color.",
    date: "2023-08-21",
    url: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000407/GSFC_20171208_Archive_e000407~orig.jpg"
  },
  {
    title: "Andromeda Galaxy (M31)",
    explanation: "The closest major spiral galaxy to our own Milky Way, spanning over 220,000 light-years and home to more than a trillion stars.",
    date: "2020-10-15",
    url: "https://images-assets.nasa.gov/image/PIA15416/PIA15416~orig.jpg"
  },
  {
    title: "Jupiter in Infrared by Webb",
    explanation: "Webb's NIRCam instrument shows Jupiter's giant storms, auroras at both poles, and faint glowing rings against the cosmic void.",
    date: "2022-08-22",
    url: "https://images-assets.nasa.gov/image/PIA25433/PIA25433~orig.jpg"
  }
]

function getRandomDate() {
  const start = new Date(1996, 0, 1).getTime()
  const end = new Date().getTime() - (24 * 60 * 60 * 1000)
  const randomTime = start + Math.random() * (end - start)
  return new Date(randomTime).toISOString().slice(0, 10)
}

async function fetchAPOD() {
  try {
    // Try fetching a random APOD entry from NASA API
    const randDate = getRandomDate()
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${randDate}&thumbs=true`)

    if (!res.ok) throw new Error(`NASA API status ${res.status}`)
    const data = await res.json()

    // Store in historical pool for offline/rate-limited instances
    try {
      const pool = JSON.parse(localStorage.getItem('apod_pool') || '[]')
      if (data.url && !pool.some(item => item.url === data.url)) {
        pool.push(data)
        if (pool.length > 20) pool.shift()
        localStorage.setItem('apod_pool', JSON.stringify(pool))
      }
    } catch { }

    applyAPOD(data)
  } catch (e) {
    console.warn('Random APOD fetch failed, picking from curated pool', e)
    applyFallback()
  }
}

function applyAPOD(d) {
  let targetUrl = heroImg
  if (d.media_type === 'video' && d.thumbnail_url) {
    targetUrl = d.thumbnail_url
  } else if (d.url || d.hdurl) {
    targetUrl = d.url || d.hdurl
  }

  // Preload image so transition is smooth
  const img = new Image()
  img.referrerPolicy = 'no-referrer'
  img.onload = () => {
    const bg = document.querySelector('.bg')
    if (bg) bg.style.backgroundImage = `url('${targetUrl}')`
  }
  img.onerror = () => {
    console.warn('NASA image failed to load, trying fallback')
    applyFallback()
  }
  img.src = targetUrl

  const titleEl = document.getElementById('apod-title')
  const explEl = document.getElementById('apod-expl')
  const dateEl = document.getElementById('apod-date')

  if (titleEl) titleEl.textContent = d.title || 'Astronomy Picture of the Day'
  if (explEl) explEl.textContent = d.explanation || 'Exploring the mysteries of deep space.'
  if (dateEl) dateEl.textContent = d.date ? `NASA APOD • ${d.date}` : ''
}

function applyFallback() {
  // Pick a random image from local pool or curated fallback list
  let pool = []
  try {
    pool = JSON.parse(localStorage.getItem('apod_pool') || '[]')
  } catch { }

  const combined = pool.length > 0 ? [...pool, ...CURATED_COSMIC_FALLBACKS] : CURATED_COSMIC_FALLBACKS
  const randomChoice = combined[Math.floor(Math.random() * combined.length)]

  const bg = document.querySelector('.bg')
  if (bg && randomChoice.url) bg.style.backgroundImage = `url('${randomChoice.url}')`

  const titleEl = document.getElementById('apod-title')
  const explEl = document.getElementById('apod-expl')
  const dateEl = document.getElementById('apod-date')

  if (titleEl) titleEl.textContent = randomChoice.title || 'Cosmic Wonder'
  if (explEl) explEl.textContent = randomChoice.explanation || 'Exploring the depths of the universe.'
  if (dateEl) dateEl.textContent = randomChoice.date ? `NASA APOD • ${randomChoice.date}` : ''
}

fetchAPOD()

// responsiveness tweak
window.addEventListener('resize', () => {
  const w = window.innerWidth
  if (w < 600) document.body.classList.add('small')
  else document.body.classList.remove('small')
})

