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
    renderer.outputColorSpace = THREE.SRGBColorSpace;   // <- behebt die Dunkelheit
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener("resize", onResize);
    renderer.domElement.addEventListener("click", onBookClick);
}

function createBooks(){
    const loader = new THREE.TextureLoader();

    // Sichtbare Fläche bei z=0 berechnen, damit sich das Grid exakt am Kamerabild orientiert
    const distance = camera.position.z;
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;

    const cols = Math.ceil(Math.sqrt(books.length * (visibleWidth / visibleHeight)));
    const rows = Math.ceil(books.length / cols);
    const cellWidth = visibleWidth / cols;
    const cellHeight = visibleHeight / rows;

    books.forEach((book, i) => {
        const texture = loader.load("images_random_book/" + book.image);
        texture.colorSpace = THREE.SRGBColorSpace;   // <- pro Textur nötig

        const geometry = new THREE.PlaneGeometry(1.1, 1.6);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 0   // startet unsichtbar für den Fly-in-Effekt
        });
        const mesh = new THREE.Mesh(geometry, material);

        const col = i % cols;
        const row = Math.floor(i / cols);
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.5;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.5;

        const targetX = -visibleWidth / 2 + cellWidth * (col + 0.5) + jitterX;
        const targetY = visibleHeight / 2 - cellHeight * (row + 0.5) + jitterY;
        const targetZ = (Math.random() - 0.5) * 1.5;

        mesh.userData = {
            book,
            baseX: targetX, baseY: targetY, baseZ: targetZ,
            speedX: 0.2 + Math.random() * 0.3,
            speedY: 0.2 + Math.random() * 0.3,
            speedZ: 0.2 + Math.random() * 0.3,
            offsetX: Math.random() * Math.PI * 2,
            offsetY: Math.random() * Math.PI * 2,
            offsetZ: Math.random() * Math.PI * 2,
            baseRotY: (Math.random() - 0.5) * 0.3,
            entryOffset: { x: 0, y: -3, z: -2 }   // Startversatz fürs Einfliegen
        };

        mesh.position.set(targetX, targetY - 3, targetZ - 2);
        mesh.rotation.y = mesh.userData.baseRotY;

        scene.add(mesh);
        bookMeshes.push(mesh);

        // Fly-in: leicht zeitversetzt pro Buch, damit sie nacheinander "reinfliegen"
        gsap.to(mesh.userData.entryOffset, {
            x: 0, y: 0, z: 0,
            duration: 1.2,
            delay: i * 0.06,
            ease: "power3.out"
        });
        gsap.to(material, {
            opacity: 1,
            duration: 1,
            delay: i * 0.06
        });
    });
}

function animate(){
    requestAnimationFrame(animate);
    const t = performance.now() * 0.0006;

    bookMeshes.forEach(mesh => {
        const u = mesh.userData;

        mesh.position.x = u.baseX + Math.sin(t * u.speedX + u.offsetX) * 0.25 + u.entryOffset.x;
        mesh.position.y = u.baseY + Math.sin(t * u.speedY + u.offsetY) * 0.2 + u.entryOffset.y;
        mesh.position.z = u.baseZ + Math.cos(t * u.speedZ + u.offsetZ) * 0.3 + u.entryOffset.z;

        mesh.rotation.y = u.baseRotY + Math.sin(t * u.speedY + u.offsetY) * 0.06;
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

// Bonus: Bücher werden klickbar, nicht nur der Generate-Button
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
    gsap.to(bookMeshes.map(m => m.material), { opacity: 0.25, duration: 0.5 });

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
    gsap.to(bookMeshes.map(m => m.material), { opacity: 1, duration: 0.5 });
}