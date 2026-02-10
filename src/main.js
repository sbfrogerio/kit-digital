import './style.css'
import toolsData from './data/tools.json'

const CATEGORY_LABELS = {
    all: 'Todas as Ferramentas',
    ia: 'IA & Inovação',
    design: 'Design & Criatividade',
    pdf: 'PDF & Documentos',
    produtividade: 'Produtividade',
    dev: 'Dev & Hosting',
    marketing: 'Marketing Digital',
    multimidia: 'Multimídia',
    escrita: 'Escrita & Texto',
    seguranca: 'Segurança & Privacidade',
    social: 'Social & Comunicação',
}

const TAG_LABELS = {
    free: 'Gratuito',
    freemium: 'Freemium',
    'open-source': 'Open Source',
}

// State
let activeCategory = 'all'
let activeTag = null
let showFavoritesOnly = false
let sortMode = 'default'
let favorites = JSON.parse(localStorage.getItem('toolbox-favs') || '[]')

// DOM refs
const toolsGrid = document.getElementById('toolsGrid')
const contentTitle = document.getElementById('contentTitle')
const contentCount = document.getElementById('contentCount')
const emptyState = document.getElementById('emptyState')
const categoryNav = document.getElementById('categoryNav')
const tagFilters = document.getElementById('tagFilters')
const sortSelect = document.getElementById('sortSelect')
const cmdOverlay = document.getElementById('cmdOverlay')
const cmdInput = document.getElementById('cmdInput')
const cmdResults = document.getElementById('cmdResults')
const themeToggle = document.getElementById('themeToggle')
const favFilterBtn = document.getElementById('favFilterBtn')
const sidebarToggle = document.getElementById('sidebarToggle')
const sidebar = document.getElementById('sidebar')

// Init theme
function initTheme() {
    const saved = localStorage.getItem('toolbox-theme')
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark')
    }
}

// Toggle theme
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('toolbox-theme', next)
}

// Toggle favorite
function toggleFavorite(id) {
    const idx = favorites.indexOf(id)
    if (idx !== -1) {
        favorites.splice(idx, 1)
    } else {
        favorites.push(id)
    }
    localStorage.setItem('toolbox-favs', JSON.stringify(favorites))
    renderTools()
}

// Filter tools
function getFilteredTools() {
    let tools = [...toolsData]

    if (activeCategory !== 'all') {
        tools = tools.filter(t => t.category === activeCategory)
    }

    if (activeTag) {
        tools = tools.filter(t => t.tags.includes(activeTag))
    }

    if (showFavoritesOnly) {
        tools = tools.filter(t => favorites.includes(t.id))
    }

    if (sortMode === 'name') {
        tools.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortMode === 'popular') {
        tools.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
    }

    return tools
}

// Create card HTML
function createCard(tool) {
    const isFav = favorites.includes(tool.id)
    const tags = tool.tags
        .map(tag => `<span class="card-tag ${tag}">${TAG_LABELS[tag] || tag}</span>`)
        .join('')

    let badges = ''
    if (tool.popular) badges += '<span class="card-badge popular">⭐ Popular</span>'
    if (tool.editorChoice) badges += '<span class="card-badge editor-choice">🏆 Destaque</span>'

    return `
    <article class="tool-card" data-id="${tool.id}" onclick="window.open('${tool.url}', '_blank')">
      <div class="card-top">
        <div class="card-emoji">${tool.emoji}</div>
        <div class="card-actions">
          <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); window.__toggleFav(${tool.id})" aria-label="Favoritar" title="Favoritar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-name">${tool.name}</div>
        <div class="card-description">${tool.description}</div>
      </div>
      <div class="card-footer">
        ${tags}
        ${badges}
        <svg class="card-link-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </div>
    </article>
  `
}

// Render tools
function renderTools() {
    const tools = getFilteredTools()
    toolsGrid.innerHTML = tools.map(createCard).join('')

    // Update title
    if (showFavoritesOnly) {
        contentTitle.textContent = '❤️ Meus Favoritos'
    } else {
        contentTitle.textContent = CATEGORY_LABELS[activeCategory] || 'Todas as Ferramentas'
    }

    // Update count
    const plural = tools.length === 1 ? 'ferramenta' : 'ferramentas'
    contentCount.textContent = `${tools.length} ${plural}`

    // Empty state
    emptyState.style.display = tools.length === 0 ? 'block' : 'none'
    toolsGrid.style.display = tools.length === 0 ? 'none' : 'grid'

    // Update fav filter button
    favFilterBtn.classList.toggle('active', showFavoritesOnly)
}

// Update category counts
function updateCounts() {
    const countAll = document.getElementById('countAll')
    if (countAll) countAll.textContent = toolsData.length

    Object.keys(CATEGORY_LABELS).forEach(cat => {
        if (cat === 'all') return
        const el = document.getElementById('count' + cat.charAt(0).toUpperCase() + cat.slice(1))
        if (el) {
            el.textContent = toolsData.filter(t => t.category === cat).length
        }
    })
}

// Category click
categoryNav.addEventListener('click', (e) => {
    const pill = e.target.closest('.category-pill')
    if (!pill) return

    categoryNav.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'))
    pill.classList.add('active')
    activeCategory = pill.dataset.category
    showFavoritesOnly = false
    renderTools()

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open')
    }
})

// Tag click
tagFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('.tag-pill')
    if (!pill) return

    if (pill.classList.contains('active')) {
        pill.classList.remove('active')
        activeTag = null
    } else {
        tagFilters.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'))
        pill.classList.add('active')
        activeTag = pill.dataset.tag
    }
    renderTools()
})

// Sort
sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value
    renderTools()
})

// Theme toggle
themeToggle.addEventListener('click', toggleTheme)

// Favorites filter
favFilterBtn.addEventListener('click', () => {
    showFavoritesOnly = !showFavoritesOnly
    if (showFavoritesOnly) {
        categoryNav.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'))
    } else {
        const allPill = categoryNav.querySelector('[data-category="all"]')
        if (allPill) allPill.classList.add('active')
        activeCategory = 'all'
    }
    renderTools()
})

// Sidebar toggle (mobile)
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open')
})

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('open')
        }
    }
})

// === Command Palette ===
function openCmdPalette() {
    cmdOverlay.classList.add('open')
    cmdInput.value = ''
    cmdInput.focus()
    renderCmdResults('')
}

function closeCmdPalette() {
    cmdOverlay.classList.remove('open')
    cmdInput.value = ''
    cmdResults.innerHTML = ''
}

function renderCmdResults(query) {
    if (!query.trim()) {
        // Show popular tools by default
        const popular = toolsData.filter(t => t.popular).slice(0, 8)
        cmdResults.innerHTML = popular.map(cmdResultItem).join('')
        return
    }

    const q = query.toLowerCase()
    const results = toolsData.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        CATEGORY_LABELS[t.category]?.toLowerCase().includes(q)
    ).slice(0, 10)

    if (results.length === 0) {
        cmdResults.innerHTML = '<div class="cmd-no-results">Nenhuma ferramenta encontrada</div>'
        return
    }

    cmdResults.innerHTML = results.map(cmdResultItem).join('')
}

function cmdResultItem(tool) {
    return `
    <div class="cmd-result-item" onclick="window.open('${tool.url}', '_blank'); closeCmdPaletteGlobal()">
      <div class="cmd-result-emoji">${tool.emoji}</div>
      <div class="cmd-result-info">
        <div class="cmd-result-name">${tool.name}</div>
        <div class="cmd-result-desc">${tool.description}</div>
      </div>
      <span class="cmd-result-cat">${CATEGORY_LABELS[tool.category] || tool.category}</span>
    </div>
  `
}

// Cmd palette input
cmdInput.addEventListener('input', () => {
    renderCmdResults(cmdInput.value)
})

// Open cmd palette triggers
document.getElementById('searchTrigger').addEventListener('click', openCmdPalette)

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (cmdOverlay.classList.contains('open')) {
            closeCmdPalette()
        } else {
            openCmdPalette()
        }
    }

    // Escape
    if (e.key === 'Escape' && cmdOverlay.classList.contains('open')) {
        closeCmdPalette()
    }
})

// Close on overlay click
cmdOverlay.addEventListener('click', (e) => {
    if (e.target === cmdOverlay) {
        closeCmdPalette()
    }
})

// Global functions for inline handlers
window.__toggleFav = toggleFavorite
window.closeCmdPaletteGlobal = closeCmdPalette

// === Init ===
initTheme()
updateCounts()
renderTools()
