const themeBtn = document.getElementById("themeBtn");

if (themeBtn) {

    themeBtn.addEventListener("click", function () {

        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            themeBtn.textContent = " Light Mode";
        } else {
            themeBtn.textContent = " Dark Mode";
        }

    });

}

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", function () {

        menuToggle.classList.toggle("active");
        mainNav.classList.toggle("open");

    });

}

const cursor = document.createElement("div");

cursor.className = "custom-cursor";

document.body.appendChild(cursor);


document.addEventListener("mousemove", function (e) {

    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";

});


document
    .querySelectorAll("a, button, select, .card, .host-card")
    .forEach(function (el) {

        el.addEventListener("mouseenter", function () {
            cursor.classList.add("hover");
        });

        el.addEventListener("mouseleave", function () {
            cursor.classList.remove("hover");
        });

    });
