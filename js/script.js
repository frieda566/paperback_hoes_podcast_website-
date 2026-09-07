const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    mainNav.classList.toggle("open");
});

const buttons = document.querySelectorAll(".host-btn");

buttons.forEach(button => {
    button.addEventListener("click", function () {
        const info = this.nextElementSibling;
        info.classList.toggle("show");

        this.textContent = info.classList.contains("show")
            ? "Hide Favorites"
            : "Show Favorites";
    });
});

const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
document.body.appendChild(cursor);

document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.querySelectorAll('a, button, select, .card, .host-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

function handleFeedError(){
    document.getElementById('instagramEmbed').style.display = 'none';
    document.getElementById('feedPlaceholder').style.display = 'block';
}
window.addEventListener('load', () => {
    setTimeout(() => {
        const frame = document.getElementById('lightwidgetFrame');
        let blocked = false;
        try {
            // If the iframe never loaded (many blockers just cancel the request)
            if (!frame || frame.offsetHeight === 0) blocked = true;
        } catch(e){
            blocked = true;
        }
        if (blocked) handleFeedError();
    }, 3000);
});

