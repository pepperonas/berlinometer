class ProductGallery {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.selectedProduct = null;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderCategories();
        this.renderProducts();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
    }

    async loadProducts() {
        try {
            // Try to fetch active products from API first
            const apiResponse = await fetch('/api/products/active');
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                if (apiData.products && apiData.products.length > 0) {
                    // Convert API products to frontend format
                    this.products = apiData.products.map(p => ({
                        id: p._id || p.id,
                        name: p.productName,
                        category: p.category,
                        material: p.metadata?.material || 'Premium-Quality PLA+',
                        price: p.metadata?.price || 0,
                        sizes: p.metadata?.size ? [p.metadata.size] : ['40cm', '50cm', '60cm'],
                        images: {
                            thumb: p.imageUrl || '/images/placeholder.jpg',
                            full: [p.imageUrl || '/images/placeholder.jpg']
                        },
                        new: false
                    }));
                    
                    // Generate categories from products
                    const uniqueCategories = [...new Set(this.products.map(p => p.category))];
                    this.categories = [
                        { id: 'all', displayName: 'ALL PRODUCTS' },
                        ...uniqueCategories.map(cat => ({
                            id: cat,
                            displayName: cat.toUpperCase()
                        }))
                    ];
                    return;
                }
            }
        } catch (error) {
            console.log('API not available, falling back to products.json');
        }
        
        // Fallback to products.json if API fails or returns no products
        try {
            const response = await fetch('/products.json');
            const data = await response.json();
            this.products = data.products;
            this.categories = data.categories;
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError();
        }
    }

    renderCategories() {
        const filterContainer = document.getElementById('category-filters');
        if (!filterContainer) return;

        filterContainer.innerHTML = this.categories.map(cat => `
            <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" 
                    data-category="${cat.id}">
                ${cat.displayName}
            </button>
        `).join('');
    }

    renderProducts() {
        const gallery = document.getElementById('product-gallery');
        if (!gallery) return;

        const filteredProducts = this.currentCategory === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === this.currentCategory);

        if (filteredProducts.length === 0) {
            gallery.innerHTML = '<div class="no-products">Keine Produkte in dieser Kategorie</div>';
            return;
        }

        gallery.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                ${product.new ? '<div class="product-badge">NEW</div>' : ''}
                <div class="product-image">
                    <img src="${product.images.thumb}" 
                         alt="${product.name}" 
                         loading="lazy">
                    <div class="product-overlay">
                        <button class="view-btn" data-product-id="${product.id}">
                            VIEW DETAILS
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-material">${product.material}</p>
                    <p class="product-price">€${product.price}</p>
                </div>
            </div>
        `).join('');

        // Add staggered animation
        const cards = gallery.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 50);
        });
    }

    showProductDetail(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.selectedProduct = product;
        const modal = document.getElementById('product-modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" aria-label="Close">×</button>
                <div class="modal-body">
                    <div class="modal-images">
                        <div class="image-main">
                            <img src="${product.images.full[0]}" 
                                 alt="${product.name}"
                                 id="main-image">
                        </div>
                        ${product.images.full.length > 1 ? `
                            <div class="image-thumbs">
                                ${product.images.full.map((img, index) => `
                                    <img src="${img}" 
                                         alt="${product.name} ${index + 1}"
                                         class="thumb ${index === 0 ? 'active' : ''}"
                                         data-index="${index}">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-details">
                        <h2 class="modal-title">${product.name}</h2>
                        <p class="modal-price">€${product.price}</p>
                        <p class="modal-material">${product.material}</p>
                        <p class="modal-description">${product.description}</p>
                        
                        <div class="modal-sizes">
                            <h4>VERFÜGBARE GRÖSSEN</h4>
                            <div class="size-options">
                                ${product.sizes.map(size => `
                                    <button class="size-btn">${size}</button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="contact-btn">
                                ANFRAGE SENDEN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        
        // Integration mit globalem Modal History Manager
        if (window.modalHistoryManager) {
            window.modalHistoryManager.openModal(
                'product-modal',
                () => this.closeModal(),
                { productId: product.id, product: product }
            );
        } else {
            document.body.classList.add('modal-open');
        }

        // Setup image gallery
        this.setupImageGallery();
    }

    setupImageGallery() {
        const thumbs = document.querySelectorAll('.image-thumbs .thumb');
        const mainImage = document.getElementById('main-image');
        
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index);
                mainImage.src = this.selectedProduct.images.full[index];
                
                document.querySelectorAll('.image-thumbs .thumb').forEach(t => {
                    t.classList.remove('active');
                });
                thumb.classList.add('active');
            });
        });
    }

    closeModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('active');
            this.selectedProduct = null;
            
            // Integration mit globalem Modal History Manager
            if (window.modalHistoryManager) {
                window.modalHistoryManager.closeModal('product-modal', () => {
                    // Modal ist bereits geschlossen, nur cleanup
                    document.body.classList.remove('modal-open');
                });
            } else {
                document.body.classList.remove('modal-open');
            }
        }
    }

    setupEventListeners() {
        // Category filters
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.currentCategory = e.target.dataset.category;
                
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                this.renderProducts();
            }

            // Product view button
            if (e.target.classList.contains('view-btn')) {
                this.showProductDetail(e.target.dataset.productId);
            }

            // Modal close
            if (e.target.classList.contains('modal-close')) {
                this.closeModal();
            }

            // Click outside modal
            if (e.target.id === 'product-modal') {
                this.closeModal();
            }

            // Contact button
            if (e.target.classList.contains('contact-btn')) {
                const subject = `Anfrage: ${this.selectedProduct.name}`;
                const body = `Ich interessiere mich für ${this.selectedProduct.name} (${this.selectedProduct.id}).`;
                window.location.href = `mailto:martin.pfeffer@celox.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }
        });
    }

    setupKeyboardNavigation() {
        // ESC wird vom globalen ModalHistoryManager behandelt
        // Nur spezifische Produkt-Keyboard-Navigation hier
    }

    showError() {
        const gallery = document.getElementById('product-gallery');
        if (gallery) {
            gallery.innerHTML = '<div class="error-message">Fehler beim Laden der Produkte</div>';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProductGallery();
});