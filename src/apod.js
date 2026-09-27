import heroImg from './assets/hero.png'

const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

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

export async function fetchAPOD() {
  // Instantly load a background from cache/fallback for zero-delay experience
  applyFallback()

  // Fetch a new one in the background to replace it (and seed the pool)
  try {
    const randDate = getRandomDate()
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${randDate}&thumbs=true`)

    if (!res.ok) throw new Error(`NASA API status ${res.status}`)
    const data = await res.json()

    // Store in historical pool
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
    console.warn('Background APOD fetch failed', e)
  }
}
