const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
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


