export function initBookmarks() {
  const linksContainer = document.querySelector('.links')
  if (!linksContainer) return

  // Default links if none exist
  const defaultLinks = [
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'YouTube', url: 'https://youtube.com' },
    { title: 'Reddit', url: 'https://reddit.com' }
  ]

  let bookmarks = []
  try {
    const stored = localStorage.getItem('custom_bookmarks')
    bookmarks = stored ? JSON.parse(stored) : defaultLinks
  } catch (e) {
    bookmarks = defaultLinks
  }

  function saveBookmarks() {
    localStorage.setItem('custom_bookmarks', JSON.stringify(bookmarks))
  }

  function renderBookmarks() {
    linksContainer.innerHTML = ''
    bookmarks.forEach((bm, index) => {
      const a = document.createElement('a')
      a.href = bm.url
      a.target = '_blank'
      a.textContent = bm.title
      
      // Allow right-click to delete
      a.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        if (confirm(`Remove bookmark for ${bm.title}?`)) {
          bookmarks.splice(index, 1)
          saveBookmarks()
          renderBookmarks()
        }
      })
      
      linksContainer.appendChild(a)
    })

    // Add "+" button
    const addBtn = document.createElement('a')
    addBtn.href = '#'
    addBtn.className = 'add-bookmark-btn'
    addBtn.textContent = '+ Add'
    addBtn.addEventListener('click', (e) => {
      e.preventDefault()
      const title = prompt('Enter bookmark title:')
      if (!title) return
      let url = prompt('Enter bookmark URL (e.g., https://example.com):')
      if (!url) return
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      
      bookmarks.push({ title, url })
      saveBookmarks()
      renderBookmarks()
    })
    linksContainer.appendChild(addBtn)
  }

  renderBookmarks()
}
