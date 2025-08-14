// KiezForm Blockchain Explorer
// Interactive blockchain visualization and search functionality

class BlockchainExplorer {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentView = 'grid';
        this.currentFilter = 'all';
        this.searchResults = [];
        this.isSearchMode = false;
        this.blocks = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadBlockchainData();
        this.loadChainInfo();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchButton = document.getElementById('search-button');
        const searchInput = document.getElementById('search-input');
        
        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            // Clear search when input is empty
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.clearSearch();
                }
            });
        }
        
        // View controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });
        
        // Filter controls
        const filterSelect = document.getElementById('transaction-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderBlocks();
            });
        }
        
        // Pagination
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
        
        // Modal controls
        const closeModal = document.getElementById('close-modal');
        const modal = document.getElementById('block-modal');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    async loadChainInfo() {
        try {
            // Load basic chain statistics
            const response = await fetch('/api/blockchain?limit=1');
            const data = await response.json();
            
            if (data.chainInfo) {
                document.getElementById('chain-name').textContent = data.chainInfo.name;
            }
            
            document.getElementById('total-blocks').textContent = data.totalBlocks || 0;
            
            // Get transfer count
            const transferResponse = await fetch('/api/blockchain?limit=1000'); // Get more for counting
            const transferData = await transferResponse.json();
            const transferCount = transferData.blocks?.filter(block => block.transactionType === 'TRANSFER').length || 0;
            
            document.getElementById('total-transfers').textContent = transferCount;
            
        } catch (error) {
            console.error('Error loading chain info:', error);
            this.showError('Fehler beim Laden der Blockchain-Informationen');
        }
    }
    
    async loadBlockchainData() {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/blockchain?page=${this.currentPage}&limit=50`);
            const data = await response.json();
            
            if (data.blocks) {
                this.blocks = data.blocks;
                this.totalPages = data.totalPages;
                this.renderBlocks();
                this.updatePagination();
            } else {
                throw new Error('No blockchain data received');
            }
            
        } catch (error) {
            console.error('Error loading blockchain data:', error);
            this.showError('Fehler beim Laden der Blockchain-Daten');
        }
    }
    
    async performSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput?.value.trim();
        
        if (!query) {
            this.showToast('Bitte gib einen Suchbegriff ein');
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await fetch(`/api/blockchain/search/${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.blocks && data.blocks.length > 0) {
                this.searchResults = data.blocks;
                this.isSearchMode = true;
                this.renderSearchResults();
                this.showToast(`${data.matches} Ergebnisse gefunden`);
            } else {
                this.showToast('Keine Ergebnisse gefunden');
                this.clearSearch();
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Fehler bei der Suche');
        }
    }
    
    clearSearch() {
        this.isSearchMode = false;
        this.searchResults = [];
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        
        this.renderBlocks();
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        this.renderBlocks();
    }
    
    renderBlocks() {
        const container = document.getElementById('blockchain-container');
        if (!container) return;
        
        let blocksToRender = this.isSearchMode ? this.searchResults : this.blocks;
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            blocksToRender = blocksToRender.filter(block => 
                block.transactionType === this.currentFilter
            );
        }
        
        const viewClass = this.currentView === 'grid' ? 'blockchain-grid' : 'blockchain-chain';
        
        container.innerHTML = `
            <div class="${viewClass}">
                ${blocksToRender.map(block => this.renderBlock(block)).join('')}
            </div>
        `;
        
        // Add click listeners to blocks
        container.querySelectorAll('.block').forEach(blockEl => {
            blockEl.addEventListener('click', () => {
                const blockId = blockEl.dataset.blockId;
                const block = blocksToRender.find(b => b.blockId === blockId);
                if (block) {
                    this.showBlockDetails(block);
                }
            });
        });
    }
    
    renderSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer || !this.searchResults.length) return;
        
        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h3>SUCHERGEBNISSE (${this.searchResults.length})</h3>
                <button class="clear-search-btn" onclick="blockchainExplorer.clearSearch()">
                    SUCHE LÖSCHEN
                </button>
            </div>
            <div class="search-results-grid">
                ${this.searchResults.slice(0, 6).map(block => this.renderBlock(block, true)).join('')}
            </div>
        `;
        
        // Add CSS for search results
        if (!document.getElementById('search-results-styles')) {
            const style = document.createElement('style');
            style.id = 'search-results-styles';
            style.textContent = `
                .search-results-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .search-results-header h3 {
                    font-size: 1rem;
                    color: #ff0000;
                    margin: 0;
                }
                .clear-search-btn {
                    background: transparent;
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    color: #ff0000;
                    padding: 0.5rem 1rem;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-transform: uppercase;
                }
                .clear-search-btn:hover {
                    background: rgba(255, 0, 0, 0.1);
                }
                .search-results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1px;
                }
            `;
            document.head.appendChild(style);
        }
        
        this.renderBlocks();
    }
    
    renderBlock(block, isHighlighted = false) {
        const date = new Date(block.timestamp).toLocaleDateString('de-DE');
        const time = new Date(block.timestamp).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const typeClass = block.transactionType.toLowerCase();
        const highlightClass = isHighlighted || this.isSearchMode ? 'highlighted' : '';
        
        return `
            <div class="block ${typeClass} ${highlightClass}" 
                 data-block-id="${block.blockId}">
                <div class="block-header">
                    <div class="block-id">${block.blockId}</div>
                    <div class="block-type">${block.transactionType}</div>
                </div>
                <div class="block-content">
                    <div class="block-product">
                        ${block.metadata?.productName || block.productId}
                    </div>
                    <div class="block-owner">
                        ${block.toOwner || 'Unknown'}
                    </div>
                </div>
                <div class="block-timestamp">
                    ${date} ${time}
                </div>
            </div>
        `;
    }
    
    showBlockDetails(block) {
        const modal = document.getElementById('block-modal');
        const detailsContainer = document.getElementById('block-details');
        
        if (!modal || !detailsContainer) return;
        
        const date = new Date(block.timestamp).toLocaleString('de-DE');
        
        detailsContainer.innerHTML = `
            <div class="detail-item">
                <div class="detail-label">Block ID</div>
                <div class="detail-value">${block.blockId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Block Number</div>
                <div class="detail-value">${block.blockNumber}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Transaction Type</div>
                <div class="detail-value">${block.transactionType}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Product ID</div>
                <div class="detail-value">${block.productId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Product Name</div>
                <div class="detail-value">${block.metadata?.productName || 'Unknown'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Serial Number</div>
                <div class="detail-value">${block.metadata?.serialNumber || 'Unknown'}</div>
            </div>
            ${block.fromOwner ? `
                <div class="detail-item">
                    <div class="detail-label">From Owner</div>
                    <div class="detail-value owner">${block.fromOwner}</div>
                </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">To Owner</div>
                <div class="detail-value owner">${block.toOwner}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Timestamp</div>
                <div class="detail-value">${date}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Previous Hash</div>
                <div class="detail-value hash">${block.previousHash}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Current Hash</div>
                <div class="detail-value hash">${block.currentHash}</div>
            </div>
            ${block.metadata?.transferMethod ? `
                <div class="detail-item">
                    <div class="detail-label">Transfer Method</div>
                    <div class="detail-value">${block.metadata.transferMethod}</div>
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        const modal = document.getElementById('block-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadBlockchainData();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadBlockchainData();
        }
    }
    
    updatePagination() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
        
        if (pageInfo) {
            pageInfo.textContent = `Seite ${this.currentPage} von ${this.totalPages}`;
        }
    }
    
    showLoading() {
        const container = document.getElementById('blockchain-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Blockchain wird geladen...</p>
                </div>
            `;
        }
    }
    
    showError(message) {
        const container = document.getElementById('blockchain-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Fehler</h3>
                    <p>${message}</p>
                    <button onclick="blockchainExplorer.loadBlockchainData()" class="retry-btn">
                        Erneut versuchen
                    </button>
                </div>
            `;
        }
        
        // Add error styles if not present
        if (!document.getElementById('error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                .error-message {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #ff4444;
                }
                .error-message h3 {
                    margin-bottom: 1rem;
                    font-size: 1.2rem;
                }
                .error-message p {
                    margin-bottom: 2rem;
                    color: #808080;
                }
                .retry-btn {
                    background: transparent;
                    border: 1px solid #ff4444;
                    color: #ff4444;
                    padding: 0.8rem 2rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .retry-btn:hover {
                    background: rgba(255, 68, 68, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            info: '#00ff00',
            error: '#ff4444',
            warning: '#ffaa00'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: ${colors[type] || colors.info};
            border: 1px solid ${colors[type] || colors.info};
            padding: 12px 20px;
            border-radius: 0;
            font-weight: 300;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.blockchainExplorer = new BlockchainExplorer();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockchainExplorer;
}