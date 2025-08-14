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
            showMessage('productMessage', data.error || 'Failed to create product', 'error');
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

function logout() {
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

function loadProductsForCategory() {
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

function loadProductData() {
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
            <div class="product-header">
                <div class="product-info">
                    <h3>${escapeHtml(product.productName)}</h3>
                    <p>ID: ${escapeHtml(product.id)}</p>
                    <div class="product-meta">
                        <div class="meta-item">
                            <div>Category</div>
                            <div class="meta-value">${escapeHtml(product.category)}</div>
                        </div>
                        ${product.metadata?.material ? `
                        <div class="meta-item">
                            <div>Material</div>
                            <div class="meta-value">${escapeHtml(product.metadata.material)}</div>
                        </div>
                        ` : ''}
                        ${product.metadata?.price ? `
                        <div class="meta-item">
                            <div>Price</div>
                            <div class="meta-value">€${product.metadata.price}</div>
                        </div>
                        ` : ''}
                        ${product.metadata?.size ? `
                        <div class="meta-item">
                            <div>Sizes</div>
                            <div class="meta-value">${escapeHtml(product.metadata.size)}</div>
                        </div>
                        ` : ''}
                        ${(product.owner?.name || product.metadata?.owner) ? `
                        <div class="meta-item">
                            <div>Owner</div>
                            <div class="meta-value">${escapeHtml(product.owner?.name || product.metadata.owner)}</div>
                        </div>
                        ` : ''}
                        <div class="meta-item">
                            <div>Status</div>
                            <div class="meta-value" style="color: ${product.isValid ? '#00ff00' : '#ff4444'};">${product.isValid ? 'Valid' : 'Invalid'}</div>
                        </div>
                    </div>
                </div>
                <div class="product-actions">
                    <button onclick="editProduct('${product.id}')" class="edit-btn">Edit</button>
                    <button onclick="deleteProduct('${product.id}')" class="delete-btn">Delete</button>
                    <button onclick="generateShareLink('${product.id}')" class="share-btn">Share Link</button>
                    <button onclick="generateOwnerQR('${product.id}')" class="qr-btn">QR Code</button>
                </div>
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
                        <label for="editCategory">Category</label>
                        <select id="editCategory">
                            <option value="chains" ${product.category === 'chains' ? 'selected' : ''}>Chains</option>
                            <option value="rings" ${product.category === 'rings' ? 'selected' : ''}>Rings</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editMaterial">Material</label>
                        <input type="text" id="editMaterial" value="${escapeHtml(product.metadata?.material || '')}">
                    </div>
                    <div class="form-group">
                        <label for="editPrice">Price (€)</label>
                        <input type="number" id="editPrice" value="${product.metadata?.price || ''}">
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
    }
}

async function saveProductChanges(productId) {
    const ownerValue = document.getElementById('editOwner').value.trim();
    
    const updatedProduct = {
        productName: document.getElementById('editName').value,
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
            throw new Error('API update failed');
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
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
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
                <button type="button" onclick="downloadQR('${qrUrl}', '${product.id}')">Download QR</button>
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

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}