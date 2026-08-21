import * as THREE from "three";

let books = [];
let scene, camera, renderer, container;
let bookMeshes = [];
let raycaster, mouse;

fetch("book_recommendation.json")
    .then(response => response.json())
    .then(data => {
        books = data;
        initScene();
        createBooks();
        animate();
    });

function initScene(){
    container = document.getElementById("floatingBooks");
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 8;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener("resize", onResize);
    renderer.domElement.addEventListener("click", onBookClick);
}

function scatterPositions(count, width, height, minDist){
    const points = [];
    const maxAttempts = 60;

    for(let i = 0; i < count; i++){
        let placed = false;

        for(let attempt = 0; attempt < maxAttempts && !placed; attempt++){
            const x = (Math.random() - 0.5) * width;
            const y = (Math.random() - 0.5) * height;

            let ok = true;
            for(const p of points){
                const dx = p.x - x, dy = p.y - y;
                if(Math.sqrt(dx*dx + dy*dy) < minDist){ ok = false; break; }
            }

            if(ok){ points.push({x, y}); placed = true; }
        }

        if(!placed){
            points.push({
                x: (Math.random() - 0.5) * width,
                y: (Math.random() - 0.5) * height
            });
        }
    }
    return points;
}

function createBooks(){
    const loader = new THREE.TextureLoader();

    const distance = camera.position.z;
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;

    const margin = 0.85;
    const usableWidth = visibleWidth * margin;
    const usableHeight = visibleHeight * margin;

    const bookWidth = 1.1;
    const minDist = bookWidth * 0.75; // erlaubt leichtes Überlappen, aber nicht komplett übereinander

    const positions = scatterPositions(books.length, usableWidth, usableHeight, minDist);

    books.forEach((book, i) => {
        const texture = loader.load("images_random_book/" + book.image);
        texture.colorSpace = THREE.SRGBColorSpace;

        const coverMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const pageMat  = new THREE.MeshBasicMaterial({ color: 0xfaf6ee, transparent: true }); // helle Buchseiten
        const spineMat = new THREE.MeshBasicMaterial({ color: 0xf0ebe0, transparent: true }); // etwas dunklere Seite/Rücken

        const materials = [spineMat, spineMat, pageMat, pageMat, coverMat, spineMat];

        const geometry = new THREE.BoxGeometry(bookWidth, 1.6, 0.18); // etwas dicker -> Seiten besser sichtbar
        const mesh = new THREE.Mesh(geometry, materials);

        const pos = positions[i];
        const targetX = pos.x;
        const targetY = pos.y;
        const targetZ = (Math.random() - 0.5) * 0.6; // leichte Tiefenstreuung für Pile-Look

        mesh.userData = {
            book,
            baseX: targetX, baseY: targetY, baseZ: targetZ,
            speedX: 0.15 + Math.random() * 0.25,
            speedY: 0.15 + Math.random() * 0.25,
            offsetX: Math.random() * Math.PI * 2,
            offsetY: Math.random() * Math.PI * 2,
            baseRotY: (Math.random() - 0.5) * 0.9,   // stärkere Y-Rotation -> manche Bücher fast "von der Seite"
            baseRotZ: (Math.random() - 0.5) * 0.7,   // Z-Rotation -> schräg liegender, durcheinander wirkender Stapel
            floatRangeX: 0.12,
            floatRangeY: 0.1,
            entryOffset: { x: 0, y: -3, z: -2 }
        };

        mesh.position.set(targetX, targetY - 3, targetZ - 2);
        mesh.rotation.y = mesh.userData.baseRotY;
        mesh.rotation.z = mesh.userData.baseRotZ;

        scene.add(mesh);
        bookMeshes.push(mesh);

        gsap.to(mesh.userData.entryOffset, {
            x: 0, y: 0, z: 0,
            duration: 1.2,
            delay: i * 0.05,
            ease: "power3.out"
        });
        gsap.to(materials, {
            opacity: 1,
            duration: 1,
            delay: i * 0.05
        });

        materials.forEach(m => { m.opacity = 0; });
    });
}

function animate(){
    requestAnimationFrame(animate);
    const t = performance.now() * 0.0006;

    bookMeshes.forEach(mesh => {
        const u = mesh.userData;

        mesh.position.x = u.baseX + Math.sin(t * u.speedX + u.offsetX) * u.floatRangeX + u.entryOffset.x;
        mesh.position.y = u.baseY + Math.sin(t * u.speedY + u.offsetY) * u.floatRangeY + u.entryOffset.y;
        mesh.position.z = u.baseZ + u.entryOffset.z;

        // sanftes Wackeln um die eigene Basis-Rotation, statt komplett neu zu rotieren
        mesh.rotation.y = u.baseRotY + Math.sin(t * u.speedY + u.offsetY) * 0.05;
        mesh.rotation.z = u.baseRotZ + Math.sin(t * u.speedX + u.offsetX) * 0.03;
    });

    renderer.render(scene, camera);
}

function onResize(){
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function onBookClick(event){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(bookMeshes);

    if(intersects.length > 0){
        showBookOverlay(intersects[0].object.userData.book);
    }
}

document.getElementById("generateBtn").addEventListener("click", () => {
    const randomBook = books[Math.floor(Math.random() * books.length)];
    showBookOverlay(randomBook);
});

function showBookOverlay(randomBook){
    container.classList.add("blurred");
    gsap.to(bookMeshes.flatMap(m => m.material), { opacity: 0.25, duration: 0.5 });

    document.getElementById("overlayBackdrop").classList.add("active");
    document.getElementById("selectedBook").src = "images_random_book/" + randomBook.image;
    document.getElementById("selectedTitle").textContent = randomBook.Book;
    document.getElementById("selectedAuthor").textContent = randomBook.Author;
    document.getElementById("spotifyFrame").src = randomBook.spotifyEmbedUrl;

    gsap.fromTo("#bookDisplay",
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    );
}

document.getElementById("closeOverlay").addEventListener("click", closeOverlay);
document.getElementById("overlayBackdrop").addEventListener("click", (e) => {
    if(e.target.id === "overlayBackdrop") closeOverlay();
});

function closeOverlay(){
    gsap.to("#bookDisplay", {
        scale: 0.7,
        opacity: 0,
        duration: 0.3,
        onComplete: () => document.getElementById("overlayBackdrop").classList.remove("active")
    });
    container.classList.remove("blurred");
    gsap.to(bookMeshes.flatMap(m => m.material), { opacity: 1, duration: 0.5 });


async function Books() {
  books = await fetch('book_guide.json').then(r => r.json());
  renderTagFilter();
  applyFilters();
}

function renderTagFilter() {
  const allTags = [...new Set(books.flatMap(book => book.tags))].sort();
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
      <div class="card-content">
        <h3>${book.Book}</h3>
        <p>${book.Author}</p>
        <div class="tags">
          ${book.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
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

loadEpisodes();
}