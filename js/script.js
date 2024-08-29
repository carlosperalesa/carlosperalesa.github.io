document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.sidebar .contact-link');
    const cards = document.querySelectorAll('.main-content .section-card');

    function showCard(sectionId) {
        cards.forEach(card => {
            if (card.id === sectionId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showCard(sectionId);
        });
    });

    // Mostrar la primera tarjeta por defecto
    if (cards.length > 0) {
        showCard(cards[0].id);
    }
});
