const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});


const buttons = document.querySelectorAll(".host-btn");

buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        const info = button.nextElementSibling;

        if (!info || !info.classList.contains("host-info")) {
            return;
        }

        if (info.classList.contains("show")) {

            info.classList.remove("show");
            button.textContent = button.dataset.name;

        } else {

            info.classList.add("show");
            button.textContent = "Hide " + button.dataset.name;

        }

    });

});

