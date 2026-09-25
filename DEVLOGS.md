devlogs - nasa_pro
===================

day 1
- set up vite, added index.html and assets folder

day 2
- hooked up NASA APOD api, added local cache so it doesnt spam the api
- fallback to hero.png if api fails

day 3
- added live clock with greeting (morning/afternoon/evening)
- added search bar and quick links (github, youtube, reddit)
- added collapsible info panel for APOD details

day 4 (sept 25 2026)
- full UI redesign. glassmorphism, hover effects, pulse animation on info button
- integrated SerpApi for real search results directly on the page
- added results panel with top 5 google results (title + snippet)
- set up vite proxy to avoid CORS with serpapi
- configured .env with both api keys (NASA + SerpApi)
- fixed clock greeting bug (was saying good morning at 9pm lol)
- fixed background not loading - nasa image was getting blocked by referrer headers
- added image preloading so background fades in smooth instead of staying black
- added cosmic gradient fallback so page never looks empty
