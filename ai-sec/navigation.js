// Navigation Component für ai-sec App
class NavigationComponent {
    constructor() {
        this.menuItems = [
            {text: 'Home', href: 'index.html', icon: '🏠'},
            {text: 'Datenschutz bei KI', href: 'privacy-concerns.html', icon: '🔒'},
            {text: 'KI als Richtlinien-Filter', href: 'ai-policy-filter.html', icon: '📋'},
            {text: 'KI-Sicherheitstraining', href: 'ai-security-practice.html', icon: '🎯'},
            {text: 'KI-Cyber-Tabletops', href: 'ai-cyber-tabletop.html', icon: '🎮'},
            {text: 'KI-Simulationstraining', href: 'ai-simulation-training.html', icon: '🎲'},
            {text: 'CAPITAL Framework', href: 'capital-framework.html', icon: '🏗️'},
            {text: 'LLM-Patterns', href: 'llm-patterns.html', icon: '🧠'},
            {text: 'Template Pattern', href: 'template-pattern.html', icon: '📄'}
        ];
        
        this.init();
    }
    
    init() {
        this.renderNavigation();
        this.setupEventListeners();
        this.highlightCurrentPage();
    }
    
    renderNavigation() {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Header Content
        const headerContent = `
            <div class="container">
                <div class="nav-wrapper">
                    <h1><a href="index.html" style="text-decoration: none; color: inherit;">KI & Cybersicherheit</a></h1>
                    <button class="nav-drawer-toggle" id="navDrawerToggle" aria-label="Navigation öffnen">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </div>
            
            <!-- Navigation Drawer -->
            <nav class="nav-drawer" id="navDrawer">
                <div class="nav-drawer-header">
                    <h2>Navigation</h2>
                    <button class="nav-drawer-close" id="navDrawerClose" aria-label="Navigation schließen">
                        <span>×</span>
                    </button>
                </div>
                <div class="nav-drawer-content">
                    <ul class="nav-drawer-menu">
                        ${this.menuItems.map(item => `
                            <li class="nav-drawer-item">
                                <a href="${item.href}" class="nav-drawer-link">
                                    <span class="nav-icon">${item.icon}</span>
                                    <span class="nav-text">${item.text}</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="nav-drawer-footer">
                    <p>&copy; 2025 Martin Pfeffer</p>
                </div>
            </nav>
            
            <!-- Navigation Overlay -->
            <div class="nav-overlay" id="navOverlay"></div>
        `;
        
        header.innerHTML = headerContent;
    }
    
    setupEventListeners() {
        const toggleBtn = document.getElementById('navDrawerToggle');
        const closeBtn = document.getElementById('navDrawerClose');
        const drawer = document.getElementById('navDrawer');
        const overlay = document.getElementById('navOverlay');
        const navLinks = document.querySelectorAll('.nav-drawer-link');
        
        // Toggle drawer
        toggleBtn?.addEventListener('click', () => this.toggleDrawer());
        closeBtn?.addEventListener('click', () => this.closeDrawer());
        overlay?.addEventListener('click', () => this.closeDrawer());
        
        // Close drawer when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeDrawer());
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer?.classList.contains('open')) {
                this.closeDrawer();
            }
        });
        
        // Close drawer on window resize (desktop)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && drawer?.classList.contains('open')) {
                this.closeDrawer();
            }
        });
    }
    
    toggleDrawer() {
        const drawer = document.getElementById('navDrawer');
        const overlay = document.getElementById('navOverlay');
        const toggle = document.getElementById('navDrawerToggle');
        
        if (drawer?.classList.contains('open')) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }
    
    openDrawer() {
        const drawer = document.getElementById('navDrawer');
        const overlay = document.getElementById('navOverlay');
        const toggle = document.getElementById('navDrawerToggle');
        
        drawer?.classList.add('open');
        overlay?.classList.add('active');
        toggle?.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const firstLink = drawer?.querySelector('.nav-drawer-link');
        firstLink?.focus();
    }
    
    closeDrawer() {
        const drawer = document.getElementById('navDrawer');
        const overlay = document.getElementById('navOverlay');
        const toggle = document.getElementById('navDrawerToggle');
        
        drawer?.classList.remove('open');
        overlay?.classList.remove('active');
        toggle?.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-drawer-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavigationComponent();
});