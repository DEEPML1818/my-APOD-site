# NASA Pro - Devlogs

### Day 1: Project Setup
I scaffolded the project using Vite to keep the bundle small and test my vanilla JavaScript skills. I created `index.html`, `main.js`, and `styles.css`. I also added a high-quality fallback image (`hero.png`) just in case APIs failed later on. The goal was to ensure CSS/JS were properly linked and sketch out the basic HTML wireframes.

### Day 2: Connecting to the Cosmos
Today I hooked up the NASA Astronomy Picture of the Day (APOD) API. To prevent hitting API rate limits every time a new tab opens, I engineered a local caching system using `localStorage`. It saves the last 20 fetched images. If the API fails, the app automatically falls back to a cached image or a hardcoded curated list, guaranteeing the background never breaks.

### Day 3: UI Skeleton (Clock & Links)
I built a precise digital clock function that formats the time into a 12-hour string and updates every second. I also added a dynamic greeting ("Good morning," "Good afternoon"). Next, I built the skeleton for the search bar and added a collapsible "Info Panel" that uses CSS transitions to slide up and display the NASA APOD title and description.

### Day 4: SerpApi Integration & Glassmorphism
This was the most intense day. I integrated the SerpApi Google Search API to bring real search results natively into the app. To fix CORS issues, I configured a Vite proxy. I built a rendering engine in Vanilla JS for Organic, Image, and News results, along with a caching layer so swapping tabs wouldn't waste API calls. Visually, I completely overhauled the CSS into a "Glassmorphism" theme using `rgba()` and `backdrop-filter: blur()`.

### Day 5: Refactoring & Custom Bookmarks
To tackle technical debt, I modularized the 650-line `main.js` into clean files (`clock.js`, `apod.js`, `bookmarks.js`). I fixed a z-index bug where the search results obscured the NASA image. I also replaced hardcoded quick links with a dynamic Custom Bookmarks engine (saving URLs to `localStorage`). Finally, I refined the background to load instantly from cache while silently fetching a new NASA image in the background. Ready to ship! 🚀
