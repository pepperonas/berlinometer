// Video loading handler
document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('.hero-video');
    if (video) {
        video.addEventListener('error', function() {
            console.log('Video failed to load, using fallback background');
            this.style.display = 'none';
        });
        
        video.addEventListener('loadstart', function() {
            console.log('Video loading started');
        });
        
        video.addEventListener('canplay', function() {
            console.log('Video can play');
            this.style.opacity = '1';
        });
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Header background on scroll
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
        header.style.background = 'var(--background)';
        header.style.boxShadow = 'var(--shadow)';
    }
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navigation = document.querySelector('.navigation');
let isMenuOpen = false;

// Create mobile menu
function createMobileMenu() {
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.innerHTML = `
        <ul class="mobile-nav-menu">
            <li><a href="#home" class="mobile-nav-link">START</a></li>
            <li><a href="#services" class="mobile-nav-link">LEISTUNGEN</a></li>
            <li><a href="#about" class="mobile-nav-link">ÜBER UNS</a></li>
            <li><a href="#contact" class="mobile-nav-link">KONTAKT</a></li>
        </ul>
        <a href="tel:040123456789" class="mobile-cta-button">ANRUFEN</a>
    `;
    document.body.appendChild(mobileMenu);
    
    // Add mobile menu styles
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu {
            position: fixed;
            top: 82px;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transform: translateY(-100%);
            transition: transform 0.3s ease;
            z-index: 999;
            padding: 2rem;
        }
        
        .mobile-menu.active {
            transform: translateY(0);
        }
        
        .mobile-nav-menu {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .mobile-nav-menu li {
            margin-bottom: 1rem;
        }
        
        .mobile-nav-link {
            color: var(--secondary-gray);
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            display: block;
            padding: 0.5rem 0;
            transition: color 0.3s ease;
        }
        
        .mobile-nav-link:hover {
            color: var(--primary-red);
        }
        
        .mobile-cta-button {
            display: inline-block;
            background: var(--primary-red);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
            width: 100%;
            text-align: center;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
        }
    `;
    document.head.appendChild(style);
    
    return mobileMenu;
}

const mobileMenu = createMobileMenu();

mobileMenuToggle.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    mobileMenu.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        isMenuOpen = false;
    });
});

// Form submission handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Here you would normally send the data to a server
        console.log('Form submitted with data:', data);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div style="background: var(--primary-red); color: white; padding: 1rem; border-radius: 5px; margin-top: 1rem; text-align: center;">
                <strong>Vielen Dank für Ihre Anfrage!</strong><br>
                Wir werden uns innerhalb von 24 Stunden bei Ihnen melden.
            </div>
        `;
        
        // Replace form with success message
        contactForm.style.display = 'none';
        contactForm.parentElement.appendChild(successMessage);
        
        // Reset form after 5 seconds
        setTimeout(() => {
            contactForm.style.display = 'block';
            successMessage.remove();
            contactForm.reset();
        }, 5000);
    });
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.animationDelay = `${index * 0.1}s`;
    observer.observe(card);
});

// Observe process steps
document.querySelectorAll('.process-step').forEach((step, index) => {
    step.style.opacity = '0';
    step.style.animationDelay = `${index * 0.15}s`;
    observer.observe(step);
});

// Observe stats
document.querySelectorAll('.stat').forEach((stat, index) => {
    stat.style.opacity = '0';
    stat.style.animationDelay = `${index * 0.1}s`;
    observer.observe(stat);
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.textContent.includes('+') ? '+' : '');
        }
    }, 16);
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('h3');
            const targetNumber = parseInt(statNumber.textContent);
            if (!isNaN(targetNumber)) {
                animateCounter(statNumber, targetNumber);
                statsObserver.unobserve(entry.target);
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// Lazy loading for images (placeholder functionality)
document.querySelectorAll('.image-placeholder').forEach(placeholder => {
    placeholder.style.opacity = '0';
    placeholder.style.transition = 'opacity 0.5s ease';
    
    // Simulate image loading
    setTimeout(() => {
        placeholder.style.opacity = '1';
    }, 500);
});

// Add hover effect to service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero && scrolled < hero.offsetHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Form field animations
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
    field.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    field.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Add ripple effect to buttons
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
    ripple.classList.add('ripple');
    
    // Add ripple styles if not already added
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .cta-button, .hero-button, .submit-button, .secondary-button, .phone-button {
                position: relative;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
        existingRipple.remove();
    }
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple effect to all buttons
document.querySelectorAll('.cta-button, .hero-button, .submit-button, .secondary-button, .phone-button').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('JPaulo Bau website loaded successfully');
    
    // Set current year in copyright
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Handle hero video
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        heroVideo.addEventListener('loadeddata', () => {
            console.log('Hero video loaded successfully');
        });
        
        heroVideo.addEventListener('error', (e) => {
            console.log('Video failed to load, using background fallback');
            heroVideo.style.display = 'none';
        });
        
        // Ensure video plays (some browsers require user interaction)
        heroVideo.play().catch(e => {
            console.log('Video autoplay prevented by browser');
        });
    }
    
    // Add initial animations
    document.querySelector('.hero-title').style.opacity = '0';
    document.querySelector('.hero-subtitle').style.opacity = '0';
    document.querySelector('.hero-button').style.opacity = '0';
    
    setTimeout(() => {
        document.querySelector('.hero-title').style.opacity = '1';
        document.querySelector('.hero-subtitle').style.opacity = '1';
        document.querySelector('.hero-button').style.opacity = '1';
    }, 100);
});