document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            // Toggle active class on button for animation
            mobileMenuToggle.classList.toggle('active');
            
            // Toggle active class on menu for slide-in
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on overlay
        navMenu.addEventListener('click', function(e) {
            if (e.target === navMenu) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
        
        // Close menu when clicking on a nav link
        const navLinksForMobile = navMenu.querySelectorAll('.nav-link');
        navLinksForMobile.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Original functionality
    // Progress bar functionality
    const progressBar = document.querySelector('.progress-bar');
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Update progress bar on scroll
    function updateProgressBar() {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = (scrollTop / documentHeight) * 100;
        
        progressBar.style.width = Math.min(scrollPercentage, 100) + '%';
    }

    // Highlight active section in navigation
    function updateActiveNavigation() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active class from all nav links
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to current section's nav link
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    // Smooth scrolling for navigation links
    function setupSmoothScrolling() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Keyboard navigation (arrow keys)
    function setupKeyboardNavigation() {
        let currentSectionIndex = 0;
        
        document.addEventListener('keydown', function(e) {
            // Only handle arrow keys if no input field is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentSectionIndex < sections.length - 1) {
                        currentSectionIndex++;
                        scrollToSection(currentSectionIndex);
                    }
                    break;
                    
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentSectionIndex > 0) {
                        currentSectionIndex--;
                        scrollToSection(currentSectionIndex);
                    }
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    currentSectionIndex = 0;
                    scrollToSection(currentSectionIndex);
                    break;
                    
                case 'End':
                    e.preventDefault();
                    currentSectionIndex = sections.length - 1;
                    scrollToSection(currentSectionIndex);
                    break;
            }
        });

        function scrollToSection(index) {
            if (sections[index]) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = sections[index].offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }

        // Update current section index based on scroll position
        function updateCurrentSectionIndex() {
            const scrollPosition = window.scrollY + 150;
            
            sections.forEach((section, index) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSectionIndex = index;
                }
            });
        }

        window.addEventListener('scroll', updateCurrentSectionIndex);
    }

    // Animate sections on scroll
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe subsections for animation
        const subsections = document.querySelectorAll('.subsection');
        subsections.forEach(subsection => {
            observer.observe(subsection);
        });
    }

    // Copy code functionality
    function setupCodeCopyFeature() {
        const codeBlocks = document.querySelectorAll('.code-block');
        
        codeBlocks.forEach(block => {
            // Create copy button
            const copyButton = document.createElement('button');
            copyButton.innerHTML = '<span class="material-icons">content_copy</span>';
            copyButton.className = 'copy-button';
            copyButton.title = 'Code kopieren';
            
            // Position button
            block.style.position = 'relative';
            copyButton.style.position = 'absolute';
            copyButton.style.top = '10px';
            copyButton.style.right = '10px';
            copyButton.style.background = 'rgba(76, 175, 80, 0.8)';
            copyButton.style.border = 'none';
            copyButton.style.borderRadius = '4px';
            copyButton.style.color = 'white';
            copyButton.style.padding = '5px';
            copyButton.style.cursor = 'pointer';
            copyButton.style.opacity = '0';
            copyButton.style.transition = 'opacity 0.3s ease';
            
            block.appendChild(copyButton);
            
            // Show button on hover
            block.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });
            
            block.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0';
            });
            
            // Copy functionality
            copyButton.addEventListener('click', async () => {
                const code = block.querySelector('code').textContent;
                
                try {
                    await navigator.clipboard.writeText(code);
                    copyButton.innerHTML = '<span class="material-icons">check</span>';
                    copyButton.style.background = '#4CAF50';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = '<span class="material-icons">content_copy</span>';
                        copyButton.style.background = 'rgba(76, 175, 80, 0.8)';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                }
            });
        });
    }

    // Search functionality
    function setupSearchFeature() {
        // Create search overlay
        const searchOverlay = document.createElement('div');
        searchOverlay.innerHTML = `
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Nano-Features durchsuchen...">
                <button id="search-close">&times;</button>
            </div>
            <div id="search-results"></div>
        `;
        searchOverlay.id = 'search-overlay';
        searchOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 14, 39, 0.95);
            backdrop-filter: blur(10px);
            z-index: 2000;
            display: none;
            padding: 2rem;
        `;
        
        const searchContainer = searchOverlay.querySelector('.search-container');
        searchContainer.style.cssText = `
            max-width: 600px;
            margin: 0 auto 2rem auto;
            position: relative;
        `;
        
        const searchInput = searchOverlay.querySelector('#search-input');
        searchInput.style.cssText = `
            width: 100%;
            padding: 1rem 3rem 1rem 1rem;
            font-size: 1.2rem;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            background: #1a1f3a;
            color: white;
        `;
        
        const closeButton = searchOverlay.querySelector('#search-close');
        closeButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #4CAF50;
            font-size: 2rem;
            cursor: pointer;
        `;
        
        document.body.appendChild(searchOverlay);

        // Toggle search with Ctrl+F
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchOverlay.style.display = 'block';
                searchInput.focus();
            }
            
            if (e.key === 'Escape') {
                searchOverlay.style.display = 'none';
            }
        });

        closeButton.addEventListener('click', () => {
            searchOverlay.style.display = 'none';
        });

        // Simple search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const resultsContainer = document.getElementById('search-results');
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }

            const results = [];
            const textElements = document.querySelectorAll('h2, h3, h4, p, li');
            
            textElements.forEach(element => {
                const text = element.textContent.toLowerCase();
                if (text.includes(query)) {
                    results.push({
                        element: element,
                        text: element.textContent.trim(),
                        section: element.closest('.content-section')?.id || 'hero'
                    });
                }
            });

            resultsContainer.innerHTML = results.slice(0, 10).map(result => `
                <div class="search-result" data-section="${result.section}">
                    <h4>${result.text.substring(0, 100)}${result.text.length > 100 ? '...' : ''}</h4>
                    <small>Sektion: ${result.section}</small>
                </div>
            `).join('');

            // Style search results
            resultsContainer.style.cssText = `
                max-width: 600px;
                margin: 0 auto;
                max-height: 60vh;
                overflow-y: auto;
            `;

            document.querySelectorAll('.search-result').forEach(result => {
                result.style.cssText = `
                    padding: 1rem;
                    margin-bottom: 1rem;
                    background: #1a1f3a;
                    border-radius: 8px;
                    cursor: pointer;
                    border: 1px solid rgba(76, 175, 80, 0.2);
                `;
                
                result.addEventListener('click', () => {
                    const sectionId = result.dataset.section;
                    const section = document.getElementById(sectionId);
                    if (section) {
                        searchOverlay.style.display = 'none';
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        });
    }

    // Header scroll effect
    function setupHeaderEffects() {
        const header = document.querySelector('.header');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.08)';
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.05)';
                header.style.boxShadow = 'none';
            }

            // Header bleibt immer sichtbar
            header.style.transform = 'translateY(0)';
            
            lastScrollY = currentScrollY;
        });
    }

    // Initialize all features
    function init() {
        setupSmoothScrolling();
        setupKeyboardNavigation();
        setupScrollAnimations();
        setupCodeCopyFeature();
        setupSearchFeature();
        setupHeaderEffects();

        // Scroll event listeners
        window.addEventListener('scroll', () => {
            updateProgressBar();
            updateActiveNavigation();
        });

        // Initial calls
        updateProgressBar();
        updateActiveNavigation();

        // Performance optimization: throttle scroll events
        let ticking = false;
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateProgressBar();
                    updateActiveNavigation();
                    ticking = false;
                });
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick, { passive: true });

        // Add loading completion class
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }

    // Start the application
    init();

    // Easter egg: Konami code
    let konamiCode = [];
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.keyCode);
        konamiCode = konamiCode.slice(-konami.length);
        
        if (konamiCode.join(',') === konami.join(',')) {
            // Easter egg: Nano appreciation message
            const message = document.createElement('div');
            message.innerHTML = '🎉 Du hast den Nano-Meister-Code entdeckt! Du bist bereit für die Profi-Liga! 🖊️✨';
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                color: white;
                padding: 2rem;
                border-radius: 12px;
                font-size: 1.2rem;
                text-align: center;
                z-index: 3000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                animation: bounceIn 0.6s ease;
            `;
            
            document.body.appendChild(message);
            
            setTimeout(() => {
                message.style.animation = 'fadeOut 0.6s ease';
                setTimeout(() => {
                    document.body.removeChild(message);
                }, 600);
            }, 3000);
            
            konamiCode = [];
        }
    });
});

// CSS animations for JavaScript effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes bounceIn {
        0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        70% { transform: translate(-50%, -50%) scale(0.9); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    
    .loaded .content-section {
        animation: slideInFromBottom 0.6s ease forwards;
    }
    
    @keyframes slideInFromBottom {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(styleSheet);