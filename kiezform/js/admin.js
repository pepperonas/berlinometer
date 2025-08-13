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
        showMessage('loginMessage', 'Connection error', 'error');
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
        showMessage('productMessage', 'Connection error', 'error');
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
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            displayProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #808080; padding: 2rem;">No products found</div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item">
            <div class="product-header">
                <div class="product-info">
                    <h3>${escapeHtml(product.productName)}</h3>
                    <p>SN: ${escapeHtml(product.serialNumber)}</p>
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
                        ${product.metadata?.size ? `
                        <div class="meta-item">
                            <div>Size</div>
                            <div class="meta-value">${escapeHtml(product.metadata.size)}</div>
                        </div>
                        ` : ''}
                        <div class="meta-item">
                            <div>Status</div>
                            <div class="meta-value" style="color: ${product.isValid ? '#00ff00' : '#ff4444'};">${product.isValid ? 'Valid' : 'Invalid'}</div>
                        </div>
                    </div>
                </div>
                <div class="product-actions">
                    <a href="/verify/${product.id}" target="_blank">View Verification</a>
                    <button onclick="generateQR('${product.id}')">Download QR</button>
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

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}