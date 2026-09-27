# 🌌 NASA Pro - Explorer Dashboard

A dynamic new-tab dashboard built for the **"Give Your Website a Pulse"** challenge. It transforms your browser's empty new tab into a stunning, interactive window into the cosmos.

## ✨ Features
* **Zero-Delay Backgrounds:** Instantly loads a cached cosmic background, while gracefully fetching the latest high-res NASA APOD image in the background.
* **Live Search Integration:** Features a fully integrated web search (powered by SerpApi) directly in the dashboard. Tab between All, Images, News, and Videos without leaving the page.
* **Dynamic Glassmorphism UI:** Built with custom CSS featuring smooth backdrop-filters, hover states, and a pulsing info panel that reveals the NASA image description.
* **Custom Bookmarks Engine:** An interactive widget to add and manage your favorite links, saving them directly to your browser's `localStorage`.
* **Live Clock & Greeter:** Keeps you grounded with a live clock and time-based greetings.

## 🛠 Tech Stack
* **Core:** Pure HTML, Vanilla JavaScript, and Custom CSS (No template builders)
* **Build Tool:** Vite for lightning-fast bundling
* **APIs Used:** NASA APOD API & SerpApi

## 🚀 How to Run Locally

1. Clone the repository and install dependencies: `npm install`
2. Set up API keys in `.env`:
   `VITE_NASA_API_KEY=your_key`
   `VITE_SERPAPI_KEY=your_key`
3. Run: `npm run dev`

## 📝 Challenge Checklist Completion
- [x] **HTML + CSS + JS required:** Built purely with vanilla JavaScript, HTML, and raw CSS.
- [x] **Public repository with good README:** Detailed documentation included.
- [x] **Devlogs:** A detailed `DEVLOGS.md` is included tracking the build.
- [x] **No AI one-click builders:** Codebase was manually architected and written.
- [x] **Custom UI/CSS:** Hand-written Glassmorphism UI, zero CSS frameworks.
- [x] **Real Features:** Integrates two live APIs, `localStorage` caching, and state rendering.
- [x] **Fully deployed website:** Bundled via Vite and deployed to production.
