let episodes = [];
let activeTag = 'all';
let searchTerm = '';

async function loadEpisodes() {
  episodes = await fetch('episode_guide.json').then(r => r.json());
  renderTagFilter();
  applyFilters();
}

function renderTagFilter() {
  const allTags = [...new Set(episodes.flatMap(ep => ep.tags))].sort();
  const filterDiv = document.getElementById('tagFilter');

  filterDiv.innerHTML = `<button class="tag-btn active" data-tag="all">All</button>` +
    allTags.map(tag => `<button class="tag-btn" data-tag="${tag}">${tag}</button>`).join('');

  filterDiv.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tag-btn')) return;

    filterDiv.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    activeTag = e.target.dataset.tag;
    applyFilters();
  });
}

function applyFilters() {
  let filtered = episodes;

  if (activeTag !== 'all') {
    filtered = filtered.filter(ep => ep.tags.includes(activeTag));
  }

  if (searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(ep =>
      ep.title.toLowerCase().includes(term) ||
      ep.description.toLowerCase().includes(term) ||
      ep.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  renderEpisodes(filtered);
}

function renderEpisodes(list) {
  const grid = document.getElementById('episodeGrid');

  if (list.length === 0) {
    grid.innerHTML = `<p class="no-results">No episodes found.</p>`;
    return;
  }

  grid.innerHTML = list.map(ep => `
    <div class="card">
      <div class="episode-number">#${ep.number}</div>
      <div class="card-content">
        <h3>${ep.title}</h3>
        <p>${ep.description}</p>
        <div class="tags">
          ${ep.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
        </div>
      </div>
      <iframe
        src="https://open.spotify.com/embed/episode/${ep.spotifyId}?theme=0"
        width="100%"
        height="152"
        frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture">
      </iframe>
    </div>
  `).join('');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchTerm = e.target.value;
  applyFilters();
});

document.getElementById('filterToggleBtn').addEventListener('click', () => {
  const tagFilter = document.getElementById('tagFilter');
  const btn = document.getElementById('filterToggleBtn');

  tagFilter.classList.toggle('show');
  btn.classList.toggle('active');
});

loadEpisodes();