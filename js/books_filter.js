let books = [];
let activeTag = 'all';
let searchTerm = '';

async function loadBooks() {
  books = await fetch("book_recommendation.json").then(r => r.json());
  renderTagFilter();
  applyFilters();
}

function renderTagFilter() {
  const allTags = [...new Set(books.flatMap(book => book.Tags))].sort();
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
  let filtered = books;

  if (activeTag !== 'all') {
    filtered = filtered.filter(book => book.Tags.includes(activeTag));
  }

  if (searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(book =>
      book.Book.toLowerCase().includes(term) ||
      book.Author.toLowerCase().includes(term) ||
      book.Tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  renderBooks(filtered);
}

function renderBooks(list) {
  const grid = document.getElementById('BookGrid');

  if (list.length === 0) {
    grid.innerHTML = `<p class="no-results">No books found.</p>`;
    return;
  }

  grid.innerHTML = list.map(book => `
    
    <div class="card">

      <img 
        src="images_random_book/${book.image}" 
        alt="${book.Book} cover"
        class="card-book-cover"
      >

      <div class="card-content">

        <h3>${book.Book}</h3>

        <p>${book.Author}</p>

        <div class="tags">
          ${book.Tags.map(tag =>
            `<span class="tag-badge">${tag}</span>`
          ).join('')}
        </div>

      </div>

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

loadBooks();