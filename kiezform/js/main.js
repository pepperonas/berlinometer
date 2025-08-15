// Enhanced Mobile Navigation für moderne Smartphones
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (navToggle && navMenu) {
    // Hamburger Toggle mit Touch-Feedback
    navToggle.addEventListener('click', (e) => {
        e.preventDefault();
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // ARIA Accessibility
        const isExpanded = navMenu.classList.contains('active');
        navToggle.setAttribute('aria-expanded', isExpanded);
        navMenu.setAttribute('aria-hidden', !isExpanded);
        
        // Vibration Feedback für Touch-Geräte
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.setAttribute('aria-hidden', 'true');
        });
    });
    
    // Close menu when clicking outside (Touch-friendly)
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Escape key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.setAttribute('aria-hidden', 'true');
            navToggle.focus(); // Return focus to toggle button
        }
    });
}

// Enhanced Smooth Scrolling für Mobile
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            // Account for fixed navbar height + extra mobile spacing
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 70;
            const isMobile = window.innerWidth <= 768;
            const extraOffset = isMobile ? 20 : 0; // Extra spacing on mobile
            
            const targetPosition = target.offsetTop - navbarHeight - extraOffset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Update URL hash
            history.pushState(null, null, targetId);
            
            // Haptic feedback on mobile
            if ('vibrate' in navigator && isMobile) {
                navigator.vibrate(30);
            }
        }
    });
});

// Mobile-optimized Touch Event Improvements
if ('ontouchstart' in window) {
    // Prevent zoom on double-tap for buttons
    document.querySelectorAll('button, .btn, .cta-button, .nav-link').forEach(element => {
        element.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.click();
        });
    });
    
    // Prevent scrolling behind modal
    function preventBodyScroll(e) {
        e.preventDefault();
    }
    
    // Disable body scroll when modal is open
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('modal') && 
                mutation.target.style.display === 'flex') {
                document.body.addEventListener('touchmove', preventBodyScroll, { passive: false });
            } else if (mutation.target.classList.contains('modal') && 
                       mutation.target.style.display === 'none') {
                document.body.removeEventListener('touchmove', preventBodyScroll);
            }
        });
    });
    
    // Observe modal changes
    document.querySelectorAll('.modal, .product-modal').forEach(modal => {
        modalObserver.observe(modal, { attributes: true, attributeFilter: ['style'] });
    });
}

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(card);
});

// Observe new section elements
document.querySelectorAll('.verification-item, .workflow-step, .security-item, .share-content').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(element);
});

// QR Code Generation for Share Section
function generateShareQR() {
    const qrContainer = document.getElementById('share-qr-code');
    if (!qrContainer) return;
    
    const qrData = 'https://kiezform.de';
    const qrSize = 200;
    
    // Using QR Server API for QR code generation
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}&bgcolor=000000&color=ffffff&margin=10`;
    
    qrContainer.innerHTML = `
        <img src="${qrImageUrl}" 
             alt="KiezForm QR Code" 
             style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.1);"
             loading="lazy">
    `;
}

// Copy to clipboard function
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Link copied to clipboard!');
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Fallback copy function for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
    } catch (err) {
        showToast('Could not copy link');
    }
    
    document.body.removeChild(textArea);
}

// Web Share API function
function shareViaWeb() {
    if (navigator.share) {
        navigator.share({
            title: 'KiezForm - 3D-gedruckter Schmuck aus Berlin',
            text: 'Entdecke einzigartigen Schmuck aus dem 3D-Drucker!',
            url: 'https://kiezform.de'
        }).catch((error) => {
            console.log('Error sharing:', error);
            copyToClipboard('https://kiezform.de');
        });
    } else {
        copyToClipboard('https://kiezform.de');
    }
}

// Toast notification function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        background: rgba(0, 255, 0, 0.9);
        color: #000;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10000;
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize QR code when page loads
document.addEventListener('DOMContentLoaded', function() {
    generateShareQR();
});

