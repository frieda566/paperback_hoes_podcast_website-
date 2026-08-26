import * as THREE from "three";

let books = [];
let scene, camera, renderer, container;
let bookMeshes = [];
let raycaster, mouse;

fetch("random_book.json")
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

function loadImageWithColor(src){
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const sampleCanvas = document.createElement("canvas");
            sampleCanvas.width = 20;
            sampleCanvas.height = 20;
            const ctx = sampleCanvas.getContext("2d");
            ctx.drawImage(img, 0, 0, 20, 20);

            let r = 0, g = 0, b = 0, count = 0;
            try {
                const data = ctx.getImageData(0, 0, 20, 20).data;
                for(let i = 0; i < data.length; i += 4){
                    r += data[i];
                    g += data[i+1];
                    b += data[i+2];
                    count++;
                }
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
            } catch(e) {
                r = 150; g = 130; b = 150;
            }

            resolve({ img, color: { r, g, b } });
        };
        img.onerror = () => resolve({ img: null, color: { r: 150, g: 130, b: 150 } });
        img.src = src;
    });
}

function extractDominantColor(img){
    let r = 255, g = 255, b = 255; 

    try {
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = 16;
        sampleCanvas.height = 16;
        const ctx = sampleCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 16, 16);

        const data = ctx.getImageData(0, 0, 16, 16).data;
        let sr = 0, sg = 0, sb = 0, count = 0;
        for(let i = 0; i < data.length; i += 4){
            sr += data[i]; sg += data[i+1]; sb += data[i+2];
            count++;
        }
        r = Math.round(sr / count);
        g = Math.round(sg / count);
        b = Math.round(sb / count);
    } catch(e){
        console.warn("Konnte Farbe nicht extrahieren (CORS?), nutze Fallback:", e.message);
    }

    return { r, g, b };
}

function createSpineTexture(color, title){
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 512; 

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(0,0,0,0.15)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.08)");
    gradient.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);

    const brightness = (color.r + color.g + color.b) / 3;
    ctx.fillStyle = brightness > 150 ? "rgba(40,40,40,0.85)" : "rgba(255,255,255,0.9)";

    ctx.font = "bold 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, 0, 0, canvas.height - 40);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;

}

function createBooks(){
    const loader = new THREE.TextureLoader();

    const distance = camera.position.z;
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;

    const bookWidth = 1.0;
    const bookHeight = 1.45;

    // Rand-Sicherheit: Buchgröße selbst von der nutzbaren Fläche abziehen
    const margin = 0.92;
    const usableWidth = (visibleWidth * margin) - bookWidth;
    const usableHeight = (visibleHeight * margin) - bookHeight;

    const minDist = bookWidth * 0.7;

    const positions = scatterPositions(books.length, usableWidth, usableHeight, minDist);

    books.forEach((book, i) => {
        loader.load(
            "images_random_book/" + book.image,
            (coverTexture) => {
                coverTexture.colorSpace = THREE.SRGBColorSpace;

                const color = extractDominantColor(coverTexture.image);
                const spineTexture = createSpineTexture(color, book.Book);

                const coverMat = new THREE.MeshBasicMaterial({ map: coverTexture, transparent: true });
                const spineMat = new THREE.MeshBasicMaterial({ map: spineTexture, transparent: true });
                const pageMat  = new THREE.MeshBasicMaterial({ color: 0xfaf6ee, transparent: true });
                const edgeMat  = new THREE.MeshBasicMaterial({ color: 0xf5f0e6, transparent: true });

                const materials = [edgeMat, spineMat, pageMat, pageMat, coverMat, edgeMat];

                const geometry = new THREE.BoxGeometry(bookWidth, bookHeight, 0.32);
                const mesh = new THREE.Mesh(geometry, materials);

                const pos = positions[i];
                const targetX = pos.x;
                const targetY = pos.y;
                const targetZ = 0;

                mesh.userData = {
                    book,
                    baseX: targetX, baseY: targetY, baseZ: targetZ,
                    speedX: 0.15 + Math.random() * 0.2,
                    speedY: 0.15 + Math.random() * 0.2,
                    offsetX: Math.random() * Math.PI * 2,
                    offsetY: Math.random() * Math.PI * 2,
                    baseRotY: (Math.random() - 0.5) * 1.8,
                    baseRotZ: (Math.random() - 0.5) * 0.6,
                    floatRangeX: 0.07,
                    floatRangeY: 0.05,
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
                gsap.to(materials, { opacity: 1, duration: 1, delay: i * 0.05 });
                materials.forEach(m => { m.opacity = 0; });
            },
            undefined,
            (err) => console.error("Fehler beim Laden von", book.image, err)
        );
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

        mesh.rotation.y = u.baseRotY + Math.sin(t * u.speedY + u.offsetY) * 0.08;
        mesh.rotation.z = u.baseRotZ + Math.sin(t * u.speedX + u.offsetX) * 0.04;
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
}