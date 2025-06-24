// Progress bar functionality
function updateProgressBar() {
    const scrollTop = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / documentHeight) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

// Active navigation highlight
function updateActiveNavigation() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

// Keyboard navigation
function handleKeyNavigation(event) {
    const sections = Array.from(document.querySelectorAll('.section'));
    const currentSection = sections.find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 150 && rect.bottom > 150;
    });

    if (!currentSection) return;

    const currentIndex = sections.indexOf(currentSection);

    if (event.key === 'ArrowDown' && currentIndex < sections.length - 1) {
        event.preventDefault();
        sections[currentIndex + 1].scrollIntoView({behavior: 'smooth'});
    } else if (event.key === 'ArrowUp' && currentIndex > 0) {
        event.preventDefault();
        sections[currentIndex - 1].scrollIntoView({behavior: 'smooth'});
    }
}

// Smooth scroll for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animation on scroll
function animateOnScroll() {
    const subsections = document.querySelectorAll('.subsection');

    subsections.forEach(subsection => {
        const rect = subsection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            subsection.classList.add('fade-in');
        }
    });
}

// Simulate engagement meters
function animateEngagementMeters() {
    const meters = document.querySelectorAll('.engagement-bar');
    meters.forEach(meter => {
        const randomWidth = Math.random() * 100;
        meter.style.width = randomWidth + '%';
    });
}

// Initialize all functionality
document.addEventListener('DOMContentLoaded', function () {
    initSmoothScroll();
    updateProgressBar();
    updateActiveNavigation();
    animateOnScroll();
    animateEngagementMeters();
});

// Event listeners
window.addEventListener('scroll', function () {
    updateProgressBar();
    updateActiveNavigation();
    animateOnScroll();
});

document.addEventListener('keydown', handleKeyNavigation);

// Intersection Observer for better performance
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('slide-in-left');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.section-header').forEach(header => {
        observer.observe(header);
    });
});

// Counter animations for different metrics
function animateCounters() {
    const counterTypes = ['.subscriber-count', '.engagement-count', '.analytics-count', '.monetization-count', '.growth-count'];

    counterTypes.forEach(type => {
        const counters = document.querySelectorAll(type);
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target')) || 0;
            const increment = target / 100;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current).toLocaleString();
            }, 20);
        });
    });
}

// Initialize counter animations
setTimeout(animateCounters, 1000);