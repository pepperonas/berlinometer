let authToken = localStorage.getItem('authToken');
let currentTab = 'products';
let productTemplates = null;

// Sichere Credential-Validierung mit SHA-256
async function validateCredentials(username, password) {
    // Gespeicherte Hash-Werte (SHA-256 mit Salt)
    const validCredentials = {
        'admin': 'f2581b93ba09a2391cecec7a3dbfe8b1d79e2ad89244173ea54b50b60a459d8d'
    };
    
    // Salt für zusätzliche Sicherheit
    const salt = 'kiezform-admin-salt-2024';
    
    try {
        // Hash des eingegebenen Passworts berechnen
        const passwordHash = await hashCredential(password + salt);
        
        // Benutzername validieren und Hash vergleichen
        return username in validCredentials && 
               await constantTimeCompare(validCredentials[username], passwordHash);
    } catch (error) {
        console.error('Credential validation error:', error);
        return false;
    }
}

// Sichere Hash-Funktion mit SHA-256
async function hashCredential(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time Vergleich gegen Timing-Angriffe
async function constantTimeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
}

// Custom themed dialog system
function showCustomConfirm(message, title = 'Bestätigung erforderlich') {
    return new Promise((resolve) => {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        // Create dialog content
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: rgba(10, 10, 10, 0.95);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        dialog.innerHTML = `
            <div style="color: #ff6b6b; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h2 style="color: #fff; margin-bottom: 1.5rem; font-size: 1.2rem; letter-spacing: 0.1em; text-transform: uppercase;">
                ${title}
            </h2>
            <div style="color: #e0e0e0; margin-bottom: 2rem; line-height: 1.6; font-size: 1rem;">
                ${message}
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="confirmBtn" style="
                    background: transparent;
                    border: 2px solid #ff6b6b;
                    color: #ff6b6b;
                    padding: 1rem 2rem;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    transition: all 0.3s;
                ">
                    ✓ JA, FORTFAHREN
                </button>
                <button id="cancelBtn" style="
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: rgba(255, 255, 255, 0.7);
                    padding: 1rem 2rem;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    transition: all 0.3s;
                ">
                    ✗ ABBRECHEN
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Integration mit globalem Modal History Manager
        if (window.modalHistoryManager) {
            window.modalHistoryManager.openModal(
                'confirm-modal',
                () => {
                    modal.remove();
                    resolve(false);
                },
                { title: title, message: message }
            );
        }

        // Add animation styles
        if (!document.getElementById('custom-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-dialog-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                #confirmBtn:hover {
                    background: rgba(255, 107, 107, 0.1) !important;
                    transform: translateY(-1px);
                }
                #cancelBtn:hover {
                    border-color: rgba(255, 255, 255, 0.6) !important;
                    color: rgba(255, 255, 255, 1) !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Event handlers
        document.getElementById('confirmBtn').onclick = () => {
            modal.remove();
            if (window.modalHistoryManager) {
                window.modalHistoryManager.closeModal('confirm-modal');
            }
            resolve(true);
        };

        document.getElementById('cancelBtn').onclick = () => {
            modal.remove();
            if (window.modalHistoryManager) {
                window.modalHistoryManager.closeModal('confirm-modal');
            }
            resolve(false);
        };

        // ESC key wird vom globalen ModalHistoryManager behandelt

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (window.modalHistoryManager) {
                    window.modalHistoryManager.closeModal('confirm-modal');
                }
                resolve(false);
            }
        });
    });
}


// Check if already logged in and token is valid
if (authToken) {
    validateTokenAndShowDashboard();
}

async function validateTokenAndShowDashboard() {
    try {
        // Test token validity with a simple API call
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showDashboard();
        } else {
            console.log('Token expired or invalid, requiring re-login');
            logout();
        }
    } catch (error) {
        console.log('API not available, showing dashboard in offline mode');
        showDashboard();
    }
}

// Login form handler - MongoDB API Integration
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData);

    try {
        // First try API authentication
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            // API authentication successful
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showToast('Login successful!', 'success');
            setTimeout(showDashboard, 1000);
        } else {
            // API failed, try local validation as fallback
            console.warn('API authentication failed, trying local validation:', data.error);
            const isValid = await validateCredentials(loginData.username, loginData.password);
            
            if (isValid) {
                // Generate local token for session management
                authToken = btoa(JSON.stringify({
                    username: loginData.username,
                    timestamp: Date.now(),
                    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                }));
                localStorage.setItem('authToken', authToken);
                showToast('Login successful (offline mode)', 'success');
                setTimeout(showDashboard, 1000);
            } else {
                showMessage('loginMessage', 'Invalid credentials', 'error');
            }
        }
    } catch (error) {
        console.error('Connection error, using local validation:', error);
        // Connection failed, use local validation as fallback
        try {
            const isValid = await validateCredentials(loginData.username, loginData.password);
            
            if (isValid) {
                authToken = btoa(JSON.stringify({
                    username: loginData.username,
                    timestamp: Date.now(),
                    expires: Date.now() + (24 * 60 * 60 * 1000)
                }));
                localStorage.setItem('authToken', authToken);
                showToast('Login successful (offline mode)', 'success');
                setTimeout(showDashboard, 1000);
            } else {
                showMessage('loginMessage', 'Invalid credentials', 'error');
            }
        } catch (localError) {
            showMessage('loginMessage', 'Authentication error - please try again', 'error');
        }
    }
});

// Product form handler
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = Object.fromEntries(formData);

    // Prepare metadata
    const metadata = {};
    if (productData.material) metadata.material = productData.material;
    if (productData.size) metadata.size = productData.size;
    if (productData.price) metadata.price = parseFloat(productData.price);
    if (productData.notes) metadata.notes = productData.notes;

    // Prepare owner object (separate from metadata)
    const owner = productData.owner ? {
        name: productData.owner,
        registrationDate: new Date()
    } : undefined;

    const finalData = {
        serialNumber: productData.serialNumber,
        productName: productData.productName,
        category: productData.category,
        imageUrl: productData.imageUrl || null,
        metadata: metadata
    };

    // Add owner if provided
    if (owner) {
        finalData.owner = owner;
    }

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(finalData)
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Product created successfully in database!', 'success');
            document.getElementById('productForm').reset();
            console.log('✅ Product created in MongoDB:', data._id || data.id);
            
            // Reload products and stats from database
            loadStats();
            if (currentTab === 'products') {
                loadProducts();
            }
        } else {
            // Handle specific error cases
            let errorMessage = data.error || 'Failed to create product';
            
            // Check for duplicate serial number error
            if (data.error && data.error.includes('Serial number already exists')) {
                errorMessage = `❌ Seriennummer "${productData.serialNumber}" ist bereits vergeben. Bitte verwende eine andere Seriennummer.`;
                // Highlight the serial number field
                const serialField = document.getElementById('serialNumber');
                if (serialField) {
                    serialField.style.borderColor = '#ff6b6b';
                    serialField.focus();
                    // Reset border color after 3 seconds
                    setTimeout(() => {
                        serialField.style.borderColor = '';
                    }, 3000);
                }
            }
            
            showMessage('productMessage', errorMessage, 'error');
        }
    } catch (error) {
        console.error('Product creation failed:', error);
        
        // Fallback: Create product locally
        const localProduct = {
            id: Date.now().toString(), // Generate temporary ID
            productName: finalData.productName,
            serialNumber: finalData.serialNumber,
            category: finalData.category,
            isValid: true,
            createdAt: new Date().toISOString(), // Add timestamp
            metadata: finalData.metadata
        };
        
        cachedProducts.push(localProduct);
        localStorage.setItem('kiezform_products', JSON.stringify(cachedProducts));
        
        displayProducts(cachedProducts);
        updateStatsFromCache();
        
        document.getElementById('productForm').reset();
        showToast('Product created locally (offline mode)', 'success');
    }
});

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').classList.add('active');
    document.getElementById('navLogoutBtn').style.display = 'block';
    loadStats();
    loadProducts();
    loadProductTemplates();
}

window.logout = function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('kiezform_products'); // Clear cached products on logout
    authToken = null;
    cachedProducts = []; // Clear memory cache
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').classList.remove('active');
    document.getElementById('navLogoutBtn').style.display = 'none';
    console.log('🚪 Logged out and cleared all cached data');
}

// Product Template System
async function loadProductTemplates() {
    try {
        const response = await fetch('/products.json');
        if (response.ok) {
            productTemplates = await response.json();
            populateCategoryDropdown();
            console.log('✅ Product templates loaded:', productTemplates.products.length);
        }
    } catch (error) {
        console.warn('Could not load product templates:', error);
    }
}

function populateCategoryDropdown() {
    const categorySelect = document.getElementById('templateCategory');
    if (!categorySelect || !productTemplates) return;
    
    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select Category...</option>';
    
    // Add categories from JSON
    productTemplates.categories.forEach(category => {
        if (category.id !== 'all') { // Skip "all" category
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.displayName;
            categorySelect.appendChild(option);
        }
    });
}

window.loadProductsForCategory = function() {
    const categorySelect = document.getElementById('templateCategory');
    const productSelect = document.getElementById('templateProduct');
    
    if (!categorySelect || !productSelect || !productTemplates) return;
    
    const selectedCategory = categorySelect.value;
    
    // Clear product dropdown
    productSelect.innerHTML = '<option value="">Select Product...</option>';
    
    if (!selectedCategory) {
        productSelect.disabled = true;
        return;
    }
    
    // Filter products by category
    const categoryProducts = productTemplates.products.filter(
        product => product.category === selectedCategory
    );
    
    // Populate product dropdown
    categoryProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
    
    productSelect.disabled = false;
}

window.loadProductData = function() {
    const productSelect = document.getElementById('templateProduct');
    if (!productSelect || !productTemplates) return;
    
    const selectedProductId = productSelect.value;
    if (!selectedProductId) return;
    
    // Find selected product
    const selectedProduct = productTemplates.products.find(
        product => product.id === selectedProductId
    );
    
    if (!selectedProduct) return;
    
    // Auto-fill form fields (but keep them editable)
    document.getElementById('productName').value = selectedProduct.name;
    document.getElementById('category').value = selectedProduct.category;
    document.getElementById('material').value = selectedProduct.material || '';
    document.getElementById('price').value = selectedProduct.price || '';
    document.getElementById('size').value = selectedProduct.sizes ? selectedProduct.sizes.join(', ') : '';
    document.getElementById('imageUrl').value = selectedProduct.images?.thumb || '';
    
    // Don't auto-fill notes field - leave it for manual input
    
    showToast(`Template "${selectedProduct.name}" loaded - all fields are editable`, 'success');
}

function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');

    if (tab === 'products') {
        loadProducts();
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
            document.getElementById('validProducts').textContent = stats.validProducts || 0;
            document.getElementById('verifications').textContent = stats.recentVerifications || stats.verificationsToday || 0;
            console.log('✅ Stats loaded from database:', stats);
        } else if (response.status === 401) {
            console.warn('Token expired, logging out');
            showToast('Session expired, please login again', 'error');
            logout();
            return;
        } else {
            console.warn('API stats failed, using cached data');
            updateStatsFromCache();
        }
    } catch (error) {
        console.warn('Error loading stats from API, using cached data:', error);
        updateStatsFromCache();
    }
}

function updateStatsFromCache() {
    const totalProducts = cachedProducts.length;
    const validProducts = cachedProducts.filter(p => p.isValid).length;
    const verificationsToday = Math.floor(Math.random() * 10) + 1; // Random demo value
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('validProducts').textContent = validProducts;
    document.getElementById('verifications').textContent = verificationsToday;
}

async function loadProducts() {
    try {
        // Try API first - prioritize database data
        const apiResponse = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (apiResponse.ok) {
            const data = await apiResponse.json();
            let products = [];
            
            // Handle different API response formats
            if (Array.isArray(data)) {
                products = data;
            } else if (data.products && Array.isArray(data.products)) {
                products = data.products;
            }
            
            // Convert API products to admin format (even if empty array)
            cachedProducts = products.map(product => ({
                id: product._id || product.id,
                productName: product.productName || product.name,
                serialNumber: product.serialNumber || (product.id && product.id.toUpperCase()) || 'N/A',
                category: product.category,
                imageUrl: product.imageUrl || null,
                isValid: product.isValid !== undefined ? product.isValid : true,
                createdAt: product.createdAt || product.manufacturingDate || product.created,
                manufacturingDate: product.manufacturingDate,
                owner: product.owner, // Keep the full owner object
                metadata: {
                    material: product.metadata?.material || product.material,
                    size: product.metadata?.size || (product.sizes ? product.sizes.join(', ') : 'N/A'),
                    price: product.metadata?.price || product.price,
                    description: product.metadata?.description || product.description,
                    notes: product.metadata?.notes,
                    owner: product.metadata?.owner || product.owner?.name || 'KiezForm Berlin' // Legacy support
                }
            }));
            
            displayProducts(cachedProducts);
            console.log('✅ Products loaded from database:', cachedProducts.length);
            return;
        } else if (apiResponse.status === 401) {
            console.warn('Token expired, logging out');
            showToast('Session expired, please login again', 'error');
            logout();
            return;
        }
    } catch (error) {
        console.warn('API not available, loading from products.json:', error);
    }

    // Fallback: Load from products.json only if API fails
    try {
        const response = await fetch('/products.json');
        if (response.ok) {
            const data = await response.json();
            if (data.products && Array.isArray(data.products)) {
                // Convert products.json format to admin format
                const adminProducts = data.products.map(product => ({
                    id: product.id,
                    productName: product.name,
                    serialNumber: product.id.toUpperCase(),
                    category: product.category,
                    isValid: true,
                    createdAt: new Date().toISOString(), // Default timestamp for JSON products
                    metadata: {
                        material: product.material,
                        size: product.sizes ? product.sizes.join(', ') : 'N/A',
                        price: product.price,
                        description: product.description,
                        images: product.images,
                        owner: 'KiezForm Berlin' // Default owner
                    }
                }));
                
                // Only check localStorage if API is completely unavailable
                const savedProducts = localStorage.getItem('kiezform_products');
                if (savedProducts) {
                    try {
                        cachedProducts = JSON.parse(savedProducts);
                        displayProducts(cachedProducts);
                        console.log('📦 Products loaded from localStorage (offline mode)');
                    } catch (e) {
                        cachedProducts = adminProducts;
                        displayProducts(adminProducts);
                        console.log('📄 Products loaded from products.json');
                    }
                } else {
                    cachedProducts = adminProducts;
                    displayProducts(adminProducts);
                    console.log('📄 Products loaded from products.json');
                }
                
                // Update stats after loading products
                updateStatsFromCache();
            } else {
                cachedProducts = [];
                displayProducts([]);
            }
        } else {
            displayNoApiMessage();
        }
    } catch (error) {
        console.error('Error loading products from JSON:', error);
        displayNoApiMessage();
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
    
    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #808080; padding: 2rem;">No products found</div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item" id="product-${product.id}">
            <!-- Modern Product Card Layout -->
            <div class="product-card-header">
                <div class="product-title-section">
                    <div class="product-name-row">
                        <h3 class="product-name">${escapeHtml(product.productName)}</h3>
                        <span class="status-dot ${product.isValid ? 'valid' : 'invalid'}" title="${product.isValid ? 'Valid Product' : 'Invalid Product'}"></span>
                    </div>
                    <div class="product-meta-row">
                        <span class="category-pill">${escapeHtml(product.category)}</span>
                        <span class="product-id">ID: ${escapeHtml(product.id)}</span>
                    </div>
                </div>
                ${product.imageUrl ? `
                <div class="product-thumbnail">
                    <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.productName)}" loading="lazy" />
                </div>
                ` : ''}
            </div>

            <div class="product-info-grid">
                ${formatProductDate(product) ? `
                <div class="info-item">
                    <div class="info-icon">🗓️</div>
                    <div class="info-content">
                        <span class="info-label">Created</span>
                        <span class="info-value">${formatProductDate(product)}</span>
                    </div>
                </div>
                ` : ''}
                
                ${product.metadata?.price ? `
                <div class="info-item">
                    <div class="info-icon">💰</div>
                    <div class="info-content">
                        <span class="info-label">Price</span>
                        <span class="info-value">€${product.metadata.price}</span>
                    </div>
                </div>
                ` : ''}
                
                ${product.metadata?.material ? `
                <div class="info-item">
                    <div class="info-icon">🔧</div>
                    <div class="info-content">
                        <span class="info-label">Material</span>
                        <span class="info-value">${escapeHtml(product.metadata.material)}</span>
                    </div>
                </div>
                ` : ''}
                
                ${product.metadata?.size ? `
                <div class="info-item">
                    <div class="info-icon">📏</div>
                    <div class="info-content">
                        <span class="info-label">Size</span>
                        <span class="info-value">${escapeHtml(product.metadata.size)}</span>
                    </div>
                </div>
                ` : ''}
                
                ${(product.owner?.name || product.metadata?.owner) ? `
                <div class="info-item">
                    <div class="info-icon">👤</div>
                    <div class="info-content">
                        <span class="info-label">Owner</span>
                        <span class="info-value">${escapeHtml(product.owner?.name || product.metadata.owner)}</span>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="product-actions-bar">
                <button onclick="editProduct('${product.id}')" class="btn-action btn-primary" title="Edit Product">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Edit
                </button>
                <button onclick="generateShareLink('${product.id}')" class="btn-action btn-secondary" title="Share Product">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    Share
                </button>
                <button onclick="generateOwnerQR('${product.id}')" class="btn-action btn-secondary" title="Generate QR Code">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
                        <rect x="13" y="13" width="2" height="2"/>
                        <rect x="15" y="15" width="2" height="2"/>
                        <rect x="13" y="17" width="2" height="2"/>
                        <rect x="15" y="19" width="2" height="2"/>
                        <rect x="17" y="13" width="2" height="2"/>
                        <rect x="19" y="15" width="2" height="2"/>
                        <rect x="17" y="17" width="2" height="2"/>
                        <rect x="19" y="19" width="2" height="2"/>
                    </svg>
                    QR
                </button>
                <button onclick="deleteProduct('${product.id}')" class="btn-action btn-danger" title="Delete Product">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function generateQR(productId) {
    try {
        const response = await fetch(`/api/qrcode/${productId}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiezform-qr-${productId}.png`;
        link.click();
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

function displayNoApiMessage() {
    const container = document.getElementById('productsList');
    container.innerHTML = `
        <div style="text-align: center; color: #808080; padding: 3rem;">
            <h3 style="color: #a0a0a0; margin-bottom: 1rem;">DEMO MODE</h3>
            <p>This admin interface is a prototype demonstration.</p>
            <p>Backend API endpoints are not implemented in this static version.</p>
            <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
                In a production environment, this would connect to a real database and API.
            </p>
        </div>
    `;
}

let cachedProducts = [];

async function editProduct(productId) {
    // Find the product in cached data
    const product = cachedProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }

    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeEditModal()"></div>
        <div class="modal-content">
            <h2>Edit Product: ${escapeHtml(product.productName)}</h2>
            <form id="editProductForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editName">Product Name</label>
                        <input type="text" id="editName" value="${escapeHtml(product.productName)}" required>
                    </div>
                    <div class="form-group">
                        <label for="editSerialNumber">Serial Number</label>
                        <input type="text" id="editSerialNumber" value="${escapeHtml(product.serialNumber || '')}" required placeholder="TC-2024-001">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editCategory">Category</label>
                        <select id="editCategory">
                            <option value="chains" ${product.category === 'chains' ? 'selected' : ''}>Chains</option>
                            <option value="rings" ${product.category === 'rings' ? 'selected' : ''}>Rings</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editMaterial">Material</label>
                        <input type="text" id="editMaterial" value="${escapeHtml(product.metadata?.material || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editPrice">Price (€)</label>
                        <input type="number" id="editPrice" value="${product.metadata?.price || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editSize">Size</label>
                        <input type="text" id="editSize" value="${escapeHtml(product.metadata?.size || '')}" placeholder="M">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editDescription">Description</label>
                    <textarea id="editDescription" rows="3">${escapeHtml(product.metadata?.description || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editSize">Size</label>
                        <input type="text" id="editSize" value="${escapeHtml(product.metadata?.size || '')}" placeholder="M">
                    </div>
                    <div class="form-group">
                        <label for="editOwner">Owner</label>
                        <input type="text" id="editOwner" value="${escapeHtml(product.owner?.name || product.metadata?.owner || '')}" placeholder="Product owner/creator">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editImageUrl">Product Image URL</label>
                        <input type="url" id="editImageUrl" value="${escapeHtml(product.imageUrl || '')}" placeholder="https://kiezform.de/images/products/...">
                    </div>
                    <div class="form-group">
                        <label for="editNotes">Notes</label>
                        <input type="text" id="editNotes" value="${escapeHtml(product.metadata?.notes || '')}" placeholder="Additional product information">
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" onclick="closeEditModal()">Cancel</button>
                    <button type="submit">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Integration mit globalem Modal History Manager
    if (window.modalHistoryManager) {
        window.modalHistoryManager.openModal(
            'edit-modal',
            () => closeEditModal(),
            { productId: productId, product: product }
        );
    }

    // Handle form submission
    document.getElementById('editProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProductChanges(productId);
    });
}

function closeEditModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
        
        // Integration mit globalem Modal History Manager
        if (window.modalHistoryManager) {
            window.modalHistoryManager.closeModal('edit-modal');
        }
    }
}

async function saveProductChanges(productId) {
    const ownerValue = document.getElementById('editOwner').value.trim();
    
    const updatedProduct = {
        productName: document.getElementById('editName').value,
        serialNumber: document.getElementById('editSerialNumber').value.trim(),
        category: document.getElementById('editCategory').value,
        metadata: {
            material: document.getElementById('editMaterial').value,
            price: parseFloat(document.getElementById('editPrice').value) || 0,
            description: document.getElementById('editDescription').value,
            size: document.getElementById('editSize').value,
            notes: document.getElementById('editNotes').value
        },
        imageUrl: document.getElementById('editImageUrl').value
    };

    // Add owner as separate object if provided
    if (ownerValue) {
        updatedProduct.owner = {
            name: ownerValue,
            registrationDate: new Date()
        };
    }

    try {
        // Try to update via API first
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedProduct)
        });

        if (response.ok) {
            const apiProduct = await response.json();
            // Update cached products with API response
            const index = cachedProducts.findIndex(p => p.id === productId);
            if (index !== -1) {
                cachedProducts[index] = {
                    id: apiProduct._id || apiProduct.id,
                    productName: apiProduct.productName,
                    serialNumber: apiProduct.serialNumber,
                    category: apiProduct.category,
                    isValid: apiProduct.isValid,
                    owner: apiProduct.owner, // Include owner field
                    metadata: apiProduct.metadata
                };
            }
            
            // Refresh display
            displayProducts(cachedProducts);
            closeEditModal();
            loadStats(); // Reload stats from API
            
            showToast('Product updated successfully in database!', 'success');
            console.log('✅ Product updated in MongoDB:', productId);
        } else {
            // Handle API errors for product updates
            const apiError = await response.json().catch(() => ({ error: 'Update failed' }));
            
            // Check for duplicate serial number error in updates
            if (apiError.error && apiError.error.includes('Serial number already exists')) {
                const serialNumber = document.getElementById('editSerialNumber').value; // Get current serial from form
                showToast(`❌ Seriennummer "${serialNumber}" ist bereits vergeben. Bitte verwende eine andere Seriennummer.`, 'error');
                
                // Highlight the serial number field in edit modal
                const editSerialField = document.getElementById('editSerialNumber');
                if (editSerialField) {
                    editSerialField.style.borderColor = '#ff6b6b';
                    editSerialField.focus();
                    // Reset border color after 3 seconds
                    setTimeout(() => {
                        editSerialField.style.borderColor = '';
                    }, 3000);
                }
                return; // Don't close modal, let user fix the error
            }
            
            throw new Error(apiError.error || 'API update failed');
        }
    } catch (error) {
        console.warn('Database update failed, saving locally:', error);
        
        // Fallback: Update cached products locally
        const index = cachedProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            cachedProducts[index] = { ...cachedProducts[index], ...updatedProduct, id: productId };
            
            // Save to localStorage as backup
            localStorage.setItem('kiezform_products', JSON.stringify(cachedProducts));
            
            // Refresh display
            displayProducts(cachedProducts);
            closeEditModal();
            
            // Update stats
            updateStatsFromCache();
            
            showToast('Product updated locally (offline mode)', 'success');
        }
    }
}

async function deleteProduct(productId) {
    if (await showCustomConfirm('Bist du sicher, dass du dieses Produkt löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.', 'Produkt löschen')) {
        try {
            // Try to delete via API first
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                // Remove from cached products
                cachedProducts = cachedProducts.filter(p => p.id !== productId);
                
                // Refresh display
                displayProducts(cachedProducts);
                loadStats(); // Reload stats from API
                
                showToast('Product deleted successfully from database!', 'success');
                console.log('✅ Product deleted from MongoDB:', productId);
            } else {
                throw new Error('API delete failed');
            }
        } catch (error) {
            console.warn('Database delete failed, removing locally:', error);
            
            // Fallback: Remove from cached products locally
            cachedProducts = cachedProducts.filter(p => p.id !== productId);
            
            // Save to localStorage
            localStorage.setItem('kiezform_products', JSON.stringify(cachedProducts));
            
            // Refresh display
            displayProducts(cachedProducts);
            
            // Update stats
            updateStatsFromCache();
            
            showToast('Product deleted locally (offline mode)', 'success');
        }
    }
}

function generateShareLink(productId) {
    const product = cachedProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }

    // Extract owner name properly - prioritize owner.name, then fallback to metadata.owner
    const ownerName = product.owner?.name || product.metadata?.owner || 'KiezForm Berlin';
    
    // Generate secure token for the product
    const token = btoa(JSON.stringify({
        productId: product.id,
        owner: ownerName,
        timestamp: Date.now()
    })).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

    const shareUrl = `${window.location.origin}/owner-verify?token=${token}&product=${product.id}`;
    
    // Show share modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeShareModal()"></div>
        <div class="modal-content">
            <h2>Share Owner Verification Link</h2>
            <div class="share-info">
                <p><strong>Product:</strong> ${escapeHtml(product.productName)}</p>
                <p><strong>Owner:</strong> ${escapeHtml(product.owner?.name || product.metadata?.owner || 'Not set')}</p>
            </div>
            <div class="form-group">
                <label for="shareUrl">Owner Verification URL:</label>
                <input type="text" id="shareUrl" value="${shareUrl}" readonly>
            </div>
            <div class="modal-actions">
                <button type="button" onclick="copyShareLink()">Copy Link</button>
                <button type="button" onclick="closeShareModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateOwnerQR(productId) {
    const product = cachedProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }

    // Extract owner name properly - prioritize owner.name, then fallback to metadata.owner
    const ownerName = product.owner?.name || product.metadata?.owner || 'KiezForm Berlin';
    
    // Generate secure token for the product
    const token = btoa(JSON.stringify({
        productId: product.id,
        owner: ownerName,
        timestamp: Date.now()
    })).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

    const shareUrl = `${window.location.origin}/owner-verify?token=${token}&product=${product.id}`;
    
    // Generate QR code using QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    
    // Show QR modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeQRModal()"></div>
        <div class="modal-content">
            <h2>Owner Verification QR Code</h2>
            <div class="share-info">
                <p><strong>Product:</strong> ${escapeHtml(product.productName)}</p>
                <p><strong>Owner:</strong> ${escapeHtml(product.owner?.name || product.metadata?.owner || 'Not set')}</p>
            </div>
            <div class="qr-container">
                <img src="${qrUrl}" alt="Owner Verification QR Code" class="qr-image">
                <p>Scan this QR code to verify ownership</p>
            </div>
            <div class="modal-actions">
                <button type="button" onclick="downloadQR('${qrUrl}', '${product.id}')" class="btn-secondary">📥 Download QR</button>
                <button type="button" onclick="downloadSTL('${product.id}', 'owner')" class="btn-stl" title="Download 3D printable STL file">🏗️ 3D Print (STL)</button>
                <button type="button" onclick="closeQRModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function copyShareLink() {
    const urlInput = document.getElementById('shareUrl');
    urlInput.select();
    document.execCommand('copy');
    showToast('Link copied to clipboard!', 'success');
}

function closeShareModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

function closeQRModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

async function downloadQR(qrUrl, productId) {
    try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiezform-owner-qr-${productId}.png`;
        link.click();
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading QR code:', error);
        showToast('Error downloading QR code', 'error');
    }
}

// STL Download Function
async function downloadSTL(productId, type) {
    try {
        showToast('Generating 3D printable STL file...', 'info');
        
        const response = await fetch(`/api/admin/generate-stl-qr/${type}/${productId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `kiezform-${type}-qr-${productId}.stl`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        // Download the STL file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        showToast(`STL file downloaded successfully! (${filename})`, 'success');
        
    } catch (error) {
        console.error('Error downloading STL:', error);
        let errorMessage = 'Error downloading STL file';
        if (error.message.includes('STL converter script not found')) {
            errorMessage = 'STL generation not available (missing Python dependencies)';
        } else if (error.message.includes('No active transfer QR')) {
            errorMessage = 'No active transfer QR code found for this product';
        } else if (error.message) {
            errorMessage = `STL generation error: ${error.message}`;
        }
        showToast(errorMessage, 'error');
    }
}

function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="toast-message">${escapeHtml(message)}</span>
        </div>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

function formatProductDate(product) {
    if (!product) return '';
    
    // Use manufacturingDate (which has been synced with blockchain MINT blocks)
    let dateValue = null;
    if (product.manufacturingDate) {
        dateValue = product.manufacturingDate;
    } else if (product.createdAt) {
        dateValue = product.createdAt;
    } else if (product.created) {
        dateValue = product.created;
    } else {
        return '';
    }
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return '';
        }
        
        // Format as German date: DD.MM.YYYY HH:mm
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
        console.warn('Error formatting product date:', error);
        return '';
    }
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Transfer QR Code Management Functions

let transferCodesData = [];
let filteredTransferCodes = [];

// Load transfer codes when tab is accessed
async function loadTransferCodes() {
    try {
        const response = await fetch('/api/admin/transfer-codes', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            transferCodesData = data.transferCodes;
            filteredTransferCodes = [...transferCodesData];
            renderTransferList();
            
            // Update statistics
            const stats = {
                total: data.totalProducts,
                missing: transferCodesData.filter(item => item.overallStatus === 'missing').length,
                active: transferCodesData.filter(item => item.overallStatus === 'active').length,
                used: transferCodesData.filter(item => item.overallStatus === 'used').length,
                expired: transferCodesData.filter(item => item.overallStatus === 'expired').length
            };
            
            updateTransferStats(stats);
            console.log('✅ Transfer codes loaded:', transferCodesData.length, 'products');
        } else {
            showMessage('transferMessage', data.error || 'Failed to load transfer codes', 'error');
        }
    } catch (error) {
        console.error('Load transfer codes error:', error);
        showMessage('transferMessage', 'Network error loading transfer codes', 'error');
    }
}

function renderTransferList() {
    const listContainer = document.getElementById('transferQRList');
    
    if (filteredTransferCodes.length === 0) {
        listContainer.innerHTML = '<div class="loading">No transfer codes found</div>';
        return;
    }
    
    const html = filteredTransferCodes.map(item => `
        <div class="transfer-item" data-product-id="${item.productId}" data-status="${item.overallStatus}">
            <div class="transfer-item-info">
                <div class="transfer-item-title">${escapeHtml(item.productName)}</div>
                <div class="transfer-item-serial">${escapeHtml(item.serialNumber)}</div>
            </div>
            
            <div class="transfer-status ${item.overallStatus}">
                ${getStatusDisplay(item.overallStatus)}
            </div>
            
            <div class="transfer-qr-preview">
                ${renderQRPreview(item)}
            </div>
            
            <div class="transfer-actions">
                ${renderTransferActions(item)}
            </div>
        </div>
    `).join('');
    
    listContainer.innerHTML = html;
}

function getStatusDisplay(status) {
    const statusMap = {
        'missing': 'Missing QR',
        'active': 'Active',
        'used': 'Used',
        'expired': 'Expired',
        'invalidated': 'Invalidated'
    };
    return statusMap[status] || status;
}

function renderQRPreview(item) {
    if (item.transferQR && item.transferQR.qrImageUrl) {
        return `<img src="${item.transferQR.qrImageUrl}" class="qr-thumbnail" alt="QR Code">`;
    } else {
        return `<div class="qr-placeholder">No QR<br>Code</div>`;
    }
}

function renderTransferActions(item) {
    const actions = [];
    
    if (item.overallStatus === 'missing') {
        actions.push(`
            <button class="transfer-btn generate" onclick="generateTransferQR('${item.productId}', false)">
                🔴 Generate
            </button>
        `);
    } else if (item.overallStatus === 'active') {
        actions.push(`
            <button class="transfer-btn qr-view" onclick="viewTransferQR('${item.productId}', '${escapeHtml(item.productName)}', '${escapeHtml(item.serialNumber)}')">
                📱 QR Code
            </button>
            <button class="transfer-btn invalidate" onclick="invalidateTransferQR('${item.productId}')">
                🚫 Invalidate
            </button>
        `);
    } else if (item.overallStatus === 'used' || item.overallStatus === 'expired') {
        actions.push(`
            <button class="transfer-btn generate" onclick="generateTransferQR('${item.productId}', true)">
                🔄 Regenerate
            </button>
        `);
        if (item.transferQR && item.transferQR.qrImageUrl) {
            actions.push(`
                <button class="transfer-btn qr-view" onclick="viewTransferQR('${item.productId}', '${escapeHtml(item.productName)}', '${escapeHtml(item.serialNumber)}')">
                    📱 QR Code
                </button>
            `);
        }
    }
    
    return actions.join('');
}

function updateTransferStats(stats) {
    // You can add statistics display here if needed
    console.log('Transfer Stats:', stats);
}

window.generateTransferQR = async function(productId, force = false) {
    try {
        showToast(force ? 'Regenerating QR code...' : 'Generating QR code...', 'info');
        
        const response = await fetch(`/api/admin/generate-transfer-qr/${productId}${force ? '?force=true' : ''}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const successMessage = data.regenerated ? 
                `QR code regenerated successfully! New Token: ${data.qrToken}` : 
                `QR code generated successfully! Token: ${data.qrToken}`;
            showToast(successMessage, 'success');
            
            // Wait a moment for the database to update, then retry loading with fresh data
            let retryCount = 0;
            const maxRetries = 3;
            
            const reloadWithRetry = async () => {
                await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 300))); // Increasing delay
                
                try {
                    // Force fresh data by clearing cache and reloading
                    const freshResponse = await fetch('/api/admin/transfer-codes?' + Date.now(), {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    if (freshResponse.ok) {
                        const freshData = await freshResponse.json();
                        if (freshData.success) {
                            transferCodesData = freshData.transferCodes;
                            filteredTransferCodes = [...transferCodesData];
                            renderTransferList();
                            
                            // Verify the new QR code is displayed
                            const updatedItem = transferCodesData.find(item => item.productId === productId);
                            if (updatedItem && updatedItem.transferQR && updatedItem.transferQR.qrToken === data.qrToken) {
                                console.log('New QR code successfully displayed:', data.qrToken);
                                return; // Success!
                            }
                        }
                    }
                    
                    // If we get here, retry if possible
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`Retrying QR refresh (${retryCount}/${maxRetries})...`);
                        await reloadWithRetry();
                    } else {
                        console.warn('Max retries reached for QR refresh');
                        showToast('QR code generated, but display may need manual refresh', 'warning');
                    }
                } catch (retryError) {
                    console.error('Retry error:', retryError);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        await reloadWithRetry();
                    }
                }
            };
            
            await reloadWithRetry();
        } else {
            showToast(data.error || 'Failed to generate QR code', 'error');
        }
    } catch (error) {
        console.error('Generate QR error:', error);
        showToast('Error generating QR code', 'error');
    }
}

window.downloadTransferQR = async function(productId) {
    try {
        // Find the transfer QR data to get the direct QR image URL
        const transferItem = transferCodesData.find(item => item.productId === productId);
        if (!transferItem || !transferItem.transferQR || !transferItem.transferQR.qrImageUrl) {
            showToast('QR Code not found', 'error');
            return;
        }
        
        // Use the same download logic as Owner QR codes
        const qrUrl = transferItem.transferQR.qrImageUrl;
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiezform-transfer-qr-${productId}.png`;
        link.click();
        
        URL.revokeObjectURL(url);
        showToast('QR Code downloaded successfully', 'success');
    } catch (error) {
        console.error('Download QR error:', error);
        showToast('Error downloading QR code', 'error');
    }
}

window.invalidateTransferQR = async function(productId) {
    if (!await showCustomConfirm('Bist du sicher, dass du diesen Transfer-QR-Code ungültig machen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.', 'QR-Code ungültig machen')) {
        return;
    }
    
    try {
        showToast('Invalidating QR code...', 'info');
        
        const response = await fetch(`/api/admin/transfer-code/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('QR code invalidated successfully', 'success');
            // Refresh the list
            await loadTransferCodes();
        } else {
            showToast(data.error || 'Failed to invalidate QR code', 'error');
        }
    } catch (error) {
        console.error('Invalidate QR error:', error);
        showToast('Error invalidating QR code', 'error');
    }
}

window.generateAllMissingQRCodes = async function() {
    if (!await showCustomConfirm('QR-Codes für alle Produkte ohne aktive Codes generieren? Dies kann einen Moment dauern.', 'Alle QR-Codes generieren')) {
        return;
    }
    
    try {
        showToast('Generating missing QR codes...', 'info');
        
        const response = await fetch('/api/admin/generate-all-missing-qr', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const successCount = data.results ? data.results.filter(r => r.success).length : 0;
            showToast(`Successfully generated ${successCount} QR codes`, 'success');
            
            // Refresh the list
            await loadTransferCodes();
        } else {
            showToast(data.error || 'Failed to generate QR codes', 'error');
        }
    } catch (error) {
        console.error('Bulk generate QR error:', error);
        showToast('Network error generating QR codes', 'error');
    }
}

window.refreshTransferList = function() {
    loadTransferCodes();
}

window.filterTransferList = function() {
    const filter = document.getElementById('statusFilter').value;
    
    if (filter === 'all') {
        filteredTransferCodes = [...transferCodesData];
    } else {
        filteredTransferCodes = transferCodesData.filter(item => item.overallStatus === filter);
    }
    
    renderTransferList();
}

window.viewTransferQR = function(productId, productName, serialNumber) {
    // Find the transfer QR data
    const transferItem = transferCodesData.find(item => item.productId === productId);
    if (!transferItem || !transferItem.transferQR || !transferItem.transferQR.qrImageUrl) {
        showToast('QR Code not found', 'error');
        return;
    }

    // Create QR modal with Owner Verification design
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeTransferQRModal()"></div>
        <div class="modal-content">
            <h2>Transfer QR Code</h2>
            
            <div style="margin: 1.5rem 0;">
                <p><span style="color: #00ff00; font-weight: 500;">Product:</span> ${escapeHtml(productName)}</p>
                <p><span style="color: #00ff00; font-weight: 500;">Serial:</span> ${escapeHtml(serialNumber)}</p>
                <p><span style="color: #00ff00; font-weight: 500;">QR Token:</span> ${escapeHtml(transferItem.transferQR.qrToken)}</p>
                <p><span style="color: #00ff00; font-weight: 500;">Status:</span> <span style="color: ${getStatusColor(transferItem.overallStatus)};">${getStatusDisplay(transferItem.overallStatus)}</span></p>
            </div>
            
            <div class="qr-container">
                <img src="${transferItem.transferQR.qrImageUrl}" alt="Transfer QR Code" class="qr-image">
                <p style="color: #808080; font-style: italic; margin-top: 1rem;">Scan this QR code for ownership transfer</p>
            </div>
            
            <div class="modal-actions">
                <button type="button" onclick="downloadTransferQRFromModal('${productId}')" class="btn-secondary">📥 Download QR</button>
                <button type="button" onclick="downloadSTL('${productId}', 'transfer')" class="btn-stl" title="Download 3D printable STL file">🏗️ 3D Print (STL)</button>
                <button type="button" onclick="closeTransferQRModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getStatusColor(status) {
    const colorMap = {
        'missing': '#b0b0b0',
        'active': '#4ade80',
        'used': '#fb923c',
        'expired': '#f87171',
        'invalidated': '#f87171'
    };
    return colorMap[status] || '#b0b0b0';
}

window.closeTransferQRModal = function() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

window.downloadTransferQRFromModal = async function(productId) {
    try {
        // Find the transfer QR data to get the direct QR image URL
        const transferItem = transferCodesData.find(item => item.productId === productId);
        if (!transferItem || !transferItem.transferQR || !transferItem.transferQR.qrImageUrl) {
            showToast('QR Code not found', 'error');
            return;
        }
        
        // Use the same download logic as Owner QR codes
        const qrUrl = transferItem.transferQR.qrImageUrl;
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiezform-transfer-qr-${productId}.png`;
        link.click();
        
        URL.revokeObjectURL(url);
        showToast('QR Code downloaded successfully', 'success');
    } catch (error) {
        console.error('Download QR error:', error);
        showToast('Error downloading QR code', 'error');
    }
}

// Update the showTab function to load transfer codes when tab is accessed
const originalShowTab = showTab;
window.showTab = function(tabName) {
    originalShowTab(tabName);
    
    if (tabName === 'transferQR') {
        loadTransferCodes();
    }
}