// === Slider automático y controlado por puntos ===
document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".slides img");
    const dots = document.querySelectorAll(".dot");
    let index = 0;
    const total = slides.length;

    // Muestra el slide según el índice
    function showSlide(n) {
        slides.forEach((slide, i) => {
            slide.classList.toggle("active", i === n);
            dots[i].classList.toggle("active", i === n);
        });
    }

    // Avanza automáticamente cada 4 segundos
    function nextSlide() {
        index = (index + 1) % total;
        showSlide(index);
    }

    // Al hacer clic en los puntos
    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            index = i;
            showSlide(index);
        });
    });

    // Inicia el auto-play
    setInterval(nextSlide, 4000);
});