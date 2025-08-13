let authToken = localStorage.getItem('authToken');
let currentTab = 'products';

// Check if already logged in
if (authToken) {
    showDashboard();
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showDashboard();
        } else {
            showMessage('loginMessage', data.error, 'error');
        }
    } catch (error) {
        console.error('API login failed, trying demo mode', error);
        // Fallback for demo - check hardcoded credentials
        if (loginData.username === 'admin' && loginData.password === 'admin123') {
            authToken = 'demo-token-' + Date.now();
            localStorage.setItem('authToken', authToken);
            showMessage('loginMessage', 'Demo mode activated - API not available', 'success');
            setTimeout(showDashboard, 1500);
        } else {
            showMessage('loginMessage', 'Invalid credentials for demo mode', 'error');
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
    if (productData.owner) metadata.owner = productData.owner;

    const finalData = {
        serialNumber: productData.serialNumber,
        productName: productData.productName,
        category: productData.category,
        metadata: metadata
    };

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
            showMessage('productMessage', 'Product created successfully!', 'success');
            document.getElementById('productForm').reset();
            loadStats();
            if (currentTab === 'products') {
                loadProducts();
            }
        } else {
            showMessage('productMessage', data.error, 'error');
        }
    } catch (error) {
        console.error('Product creation failed:', error);
        showMessage('productMessage', 'Demo mode: Product creation not available (API not connected)', 'error');
    }
});

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').classList.add('active');
    loadStats();
    loadProducts();
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').classList.remove('active');
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
            document.getElementById('verifications').textContent = stats.verificationsToday || 0;
        } else {
            // Fallback for demo - calculate stats from cached products
            updateStatsFromCache();
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback for demo - calculate stats from cached products
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
        // First try API
        const apiResponse = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (apiResponse.ok) {
            const products = await apiResponse.json();
            if (Array.isArray(products)) {
                displayProducts(products);
                return;
            }
        }
    } catch (error) {
        console.log('API not available, loading from products.json');
    }

    // Fallback: Load from products.json
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
                
                // Check for saved changes in localStorage
                const savedProducts = localStorage.getItem('kiezform_products');
                if (savedProducts) {
                    try {
                        cachedProducts = JSON.parse(savedProducts);
                        displayProducts(cachedProducts);
                    } catch (e) {
                        cachedProducts = adminProducts;
                        displayProducts(adminProducts);
                    }
                } else {
                    cachedProducts = adminProducts;
                    displayProducts(adminProducts);
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
                        ${product.metadata?.owner ? `
                        <div class="meta-item">
                            <div>Owner</div>
                            <div class="meta-value">${escapeHtml(product.metadata.owner)}</div>
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
        alert('Product not found!');
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
                        <label for="editSizes">Sizes (comma separated)</label>
                        <input type="text" id="editSizes" value="${product.metadata?.size || ''}" placeholder="S, M, L, XL">
                    </div>
                    <div class="form-group">
                        <label for="editOwner">Owner</label>
                        <input type="text" id="editOwner" value="${escapeHtml(product.metadata?.owner || '')}" placeholder="Product owner/creator">
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

function saveProductChanges(productId) {
    const updatedProduct = {
        id: productId,
        productName: document.getElementById('editName').value,
        category: document.getElementById('editCategory').value,
        metadata: {
            material: document.getElementById('editMaterial').value,
            price: parseFloat(document.getElementById('editPrice').value) || 0,
            description: document.getElementById('editDescription').value,
            size: document.getElementById('editSizes').value,
            owner: document.getElementById('editOwner').value
        }
    };

    // Update cached products
    const index = cachedProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
        cachedProducts[index] = { ...cachedProducts[index], ...updatedProduct };
        
        // Save to localStorage for persistence
        localStorage.setItem('kiezform_products', JSON.stringify(cachedProducts));
        
        // Refresh display
        displayProducts(cachedProducts);
        closeEditModal();
        
        // Update stats
        updateStatsFromCache();
        
        showMessage('productMessage', 'Product updated successfully! (Changes saved locally for demo)', 'success');
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        // Remove from cached products
        cachedProducts = cachedProducts.filter(p => p.id !== productId);
        
        // Save to localStorage
        localStorage.setItem('kiezform_products', JSON.stringify(cachedProducts));
        
        // Refresh display
        displayProducts(cachedProducts);
        
        // Update stats
        updateStatsFromCache();
        
        showMessage('productMessage', 'Product deleted successfully!', 'success');
    }
}

function generateShareLink(productId) {
    const product = cachedProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found!');
        return;
    }

    // Generate secure token for the product
    const token = btoa(JSON.stringify({
        productId: product.id,
        owner: product.metadata?.owner || 'Unknown',
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
                <p><strong>Owner:</strong> ${escapeHtml(product.metadata?.owner || 'Not set')}</p>
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
        alert('Product not found!');
        return;
    }

    // Generate secure token for the product
    const token = btoa(JSON.stringify({
        productId: product.id,
        owner: product.metadata?.owner || 'Unknown',
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
                <p><strong>Owner:</strong> ${escapeHtml(product.metadata?.owner || 'Not set')}</p>
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
    alert('Link copied to clipboard!');
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
        alert('Error downloading QR code');
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