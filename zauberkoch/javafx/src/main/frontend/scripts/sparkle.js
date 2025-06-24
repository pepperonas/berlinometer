window.startSparkleAnimation = (element) => {
    const rect = element.getBoundingClientRect();
    const sparkleContainer = document.createElement("div");

    sparkleContainer.style.position = "absolute";
    sparkleContainer.style.top = `${rect.top + window.scrollY}px`;
    sparkleContainer.style.left = `${rect.left + window.scrollX}px`;
    sparkleContainer.style.width = `${rect.width}px`;
    sparkleContainer.style.height = `${rect.height}px`;
    sparkleContainer.style.pointerEvents = "none";
    document.body.appendChild(sparkleContainer);

    let sparkleInterval = setInterval(() => {
        for (let i = 0; i < 10; i++) {
            const sparkle = document.createElement("div");
            sparkle.classList.add("sparkle");

            // 50% helle, 50% dunkle Partikel
            if (Math.random() > 0.5) {
                sparkle.classList.add("sparkle-light");
            } else {
                sparkle.classList.add("sparkle-dark");
            }

            let size = Math.random() * 2 + 1; // Größe zwischen 1px und 3px
            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;

            sparkle.style.left = `${Math.random() * rect.width}px`;
            sparkle.style.top = `${Math.random() * rect.height}px`;

            sparkle.style.animationDuration = `${2 + Math.random()}s`;
            sparkle.style.animationDelay = `${Math.random()}s`;

            sparkleContainer.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 2500);
        }
    }, 200);

    setTimeout(() => {
        clearInterval(sparkleInterval);
        sparkleContainer.style.transition = "opacity 1s ease-out";
        sparkleContainer.style.opacity = "0";
        setTimeout(() => sparkleContainer.remove(), 1000);
    }, 5000);
};
