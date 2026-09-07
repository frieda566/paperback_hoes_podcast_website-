let recommendationBooks = [];
let fuse; 
let activeTags = new Set(); 
let searchTerm = '';

function renderStars(rating){
    if(rating === undefined || rating === null) return "";

    let html = "";
    const fullStars = Math.floor(rating);
    const hasHalf = (rating % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    for(let i = 0; i < fullStars; i++){
        html += `<span class="star-full"></span>`;
    }
    if(hasHalf){
        html += `<span class="star-half"></span>`;
    }
    for(let i = 0; i < emptyStars; i++){
        html += `<span class="star-empty"></span>`;
    }

    return html;
}

async function loadBooks() {
    try {
        recommendationBooks = await fetch("book_recommendation.json").then(r => r.json());

        fuse = new Fuse(recommendationBooks, {
            keys: [
                {
                    name: "Book",
                    weight: 0.5
                },
                {
                    name: "Author",
                    weight: 0.3
                },
                {
                    name: "Tags",
                    weight: 0.2
                }
            ],
            threshold: 0.35,
            ignoreLocation: true,
            minMatchCharLength: 2
        });

        renderTagFilter();
        applyFilters();
    } catch (err) {
        console.error("The books could not be loaded:", err);
    }
}

function renderTagFilter() {
    const allTags = [...new Set(recommendationBooks.flatMap(book => book.Tags))].sort();
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
    let filtered = recommendationBooks;

    if (activeTags.size > 0) {
        filtered = filtered.filter(book =>
            book.Tags.some(tag => activeTags.has(tag))
        );
    }

    if (searchTerm.trim() !== '') {
        const results = fuse.search(searchTerm);

        const searchResults = results.map(result => result.item);

        filtered = searchResults.filter(book =>
            filtered.includes(book)
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
                ${book.ratings ? `
                <div class="host-ratings card-ratings">
                    <div class="host-rating">
                        <img src="images/rachel.jpeg" alt="Rachel" class="host-avatar">
                        <div class="stars">${renderStars(book.ratings.rachel)}</div>
                    </div>
                    <div class="host-rating">
                        <img src="images/laureen.jpeg" alt="Laureen" class="host-avatar">
                        <div class="stars">${renderStars(book.ratings.laureen)}</div>
                    </div>
                </div>
                ` : ''}
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