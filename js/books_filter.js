let books = [];
let activeTags = new Set(); 
let searchTerm = '';

async function loadBooks() {
    try {
        books = await fetch("book_recommendation.json").then(r => r.json());
        renderTagFilter();
        applyFilters();
    } catch (err) {
        console.error("Fehler beim Laden der Bücher:", err);
    }
}

function renderTagFilter() {
    const allTags = [...new Set(books.flatMap(book => book.Tags))].sort();
    const filterDiv = document.getElementById('tagFilter');

    filterDiv.innerHTML = `<button class="tag-btn active" data-tag="all">All</button>` +
        allTags.map(tag => `<button class="tag-btn" data-tag="${tag}">${tag}</button>`).join('');

    filterDiv.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tag-btn')) return;

        const clickedTag = e.target.dataset.tag;

        if (clickedTag === 'all') {
            activeTags.clear();
            filterDiv.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        } else {
            e.target.classList.toggle('active');

            if (activeTags.has(clickedTag)) {
                activeTags.delete(clickedTag);
            } else {
                activeTags.add(clickedTag);
            }

            const allBtn = filterDiv.querySelector('[data-tag="all"]');
            if (activeTags.size > 0) {
                allBtn.classList.remove('active');
            } else {
                allBtn.classList.add('active');
            }
        }

        applyFilters();
    });
}

function applyFilters() {
    let filtered = books;

    if (activeTags.size > 0) {
        filtered = filtered.filter(book =>
            book.Tags.some(tag => activeTags.has(tag))
        );
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
    <div class="flip-card">
        <div class="flip-card-inner">
            <div class="flip-card-front">
                <img 
                    src="images_random_book/${book.image}" 
                    alt="${book.Book} cover"
                    class="card-book-cover"
                >
            </div>
            <div class="flip-card-back">
                <h3>${book.Book}</h3>
                <p class="back-author">${book.Author}</p>
                <div class="tags">
                    ${book.Tags.map(tag =>
                        `<span class="tag-badge">${tag}</span>`
                    ).join('')}
                </div>
            </div>
        </div>
        <div class="flip-hint-arrow">↻</div>
    </div>
    `).join('');

    document.querySelectorAll('.flip-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });
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