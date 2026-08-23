document.querySelectorAll('.host-card').forEach(card => {

    const button = card.querySelector('.favorite-btn');
    const info = card.querySelector('.host-info');

    button.addEventListener('click', () => {

        info.classList.toggle('show');

        if (info.classList.contains('show')) {
            button.textContent = 'Hide Favorites';
        } else {
            button.textContent = 'Show Favorites';
        }

    });

});


