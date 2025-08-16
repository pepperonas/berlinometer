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
        
        // Keyboard shortcuts (ESC wird vom globalen ModalHistoryManager behandelt)
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
            // Leere Suche = Clear Search
            this.clearSearch();
            return;
        }
        
        try {
            this.showSearchLoading(searchInput);
            
            const response = await fetch(`/api/blockchain/search/${encodeURIComponent(query)}`);
            const data = await response.json();
            
            this.hideSearchLoading(searchInput);
            
            if (data.blocks && data.blocks.length > 0) {
                this.searchResults = data.blocks;
                this.isSearchMode = true;
                await this.animateSearchSuccess(searchInput, data.blocks.length);
                
                // Prüfe, ob bereits Suchergebnisse angezeigt werden
                const resultsContainer = document.getElementById('search-results');
                const hasExistingResults = resultsContainer && resultsContainer.innerHTML !== '';
                
                if (hasExistingResults) {
                    // Bestehende Ergebnisse erst ausblenden, dann neue anzeigen
                    await this.fadeOutSearchResultsAsync();
                }
                
                this.renderSearchResults();
                this.renderBlocks(); // Rendere Blöcke mit Highlighting
                
                // Scrolle zu den Suchergebnissen und animiere sie
                setTimeout(() => {
                    const searchResultsSection = document.getElementById('search-results');
                    if (searchResultsSection) {
                        searchResultsSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        // Animiere die Suchergebnis-Blöcke
                        this.animateSearchResultBlocks();
                    }
                }, 300);
            } else {
                // Keine Ergebnisse gefunden
                this.fadeOutSearchResults(); // Blende vorherige Suchergebnisse aus
                this.searchResults = [];
                this.isSearchMode = false;
                await this.animateSearchNotFound(searchInput);
                this.renderBlocks(); // Zeige alle Blöcke ohne Highlighting
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.hideSearchLoading(searchInput);
            this.animateSearchError(searchInput, 'Fehler bei der Suche');
            this.clearSearch();
        }
    }
    
    async fadeOutExistingResults() {
        return new Promise((resolve) => {
            const resultsContainer = document.getElementById('search-results');
            const existingBlocks = resultsContainer?.querySelectorAll('.search-result-block');
            const wrapper = resultsContainer?.querySelector('.search-results-wrapper');
            
            if (existingBlocks && existingBlocks.length > 0 && wrapper) {
                // Material Design 3: Reverse-Order Exit
                const blocksArray = Array.from(existingBlocks);
                const reversedBlocks = blocksArray.reverse();
                
                // Sequenzielle Verschwinden-Animation von hinten nach vorn
                reversedBlocks.forEach((block, index) => {
                    block.style.animation = `searchResultFadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards`;
                    block.style.animationDelay = `${index * 80}ms`;
                });
                
                // Container Collapse Animation
                const blockAnimationTime = (reversedBlocks.length * 80) + 200;
                setTimeout(() => {
                    wrapper.style.animation = 'containerCollapse 300ms cubic-bezier(0.4, 0, 1, 1) forwards';
                    
                    // Warte bis Container-Animation fertig ist
                    setTimeout(() => {
                        // Entferne Highlights von Live-Blockchain
                        const existingHighlights = document.querySelectorAll('.block.highlighted');
                        existingHighlights.forEach(block => {
                            block.classList.remove('highlighted');
                        });
                        resolve();
                    }, 300);
                }, blockAnimationTime);
            } else {
                // Keine vorhandenen Blöcke, nur Highlights entfernen
                const existingHighlights = document.querySelectorAll('.block.highlighted');
                existingHighlights.forEach(block => {
                    block.classList.remove('highlighted');
                });
                resolve();
            }
        });
    }
    
    animateSearchSuccess(searchInput, resultCount) {
        return new Promise((resolve) => {
            // Entferne vorherige Animationen
            searchInput.classList.remove('search-input-error', 'search-animation-not-found');
            
            // Füge Success Animation hinzu
            searchInput.classList.add('search-animation-success');
            
            // Haptic Feedback für mobile Geräte
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 100]);
            }
            
            // Success Toast mit Animation
            this.showToast(`${resultCount} Zertifikate gefunden`, 'success');
            
            // Animation nach 1.5s entfernen
            setTimeout(() => {
                searchInput.classList.remove('search-animation-success');
                resolve();
            }, 1500);
        });
    }
    
    animateSearchNotFound(searchInput) {
        return new Promise((resolve) => {
            // Entferne vorherige Animationen
            searchInput.classList.remove('search-animation-success');
            
            // Füge Error Animationen hinzu
            searchInput.classList.add('search-animation-not-found', 'search-input-error');
            
            // Haptic Feedback für Fehler
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }
            
            // Error Toast
            this.showToast('Kein Zertifikat gefunden', 'error');
            
            // Animation nach 1.5s entfernen
            setTimeout(() => {
                searchInput.classList.remove('search-animation-not-found', 'search-input-error');
                resolve();
            }, 1500);
        });
    }
    
    animateSearchError(searchInput, message) {
        // Entferne vorherige Animationen
        searchInput.classList.remove('search-animation-success');
        
        // Füge Error Animationen hinzu
        searchInput.classList.add('search-animation-not-found', 'search-input-error');
        
        // Haptic Feedback
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
        
        this.showToast(message, 'error');
        
        // Animation nach 1.5s entfernen
        setTimeout(() => {
            searchInput.classList.remove('search-animation-not-found', 'search-input-error');
        }, 1500);
    }
    
    showSearchLoading(searchInput) {
        searchInput.classList.add('search-loading');
        searchInput.disabled = true;
        searchInput.placeholder = 'Durchsuche Blockchain...';
    }
    
    hideSearchLoading(searchInput) {
        searchInput.classList.remove('search-loading');
        searchInput.disabled = false;
        searchInput.placeholder = 'Produkt-ID, Block-ID oder Eigentümer-Code eingeben...';
    }
    
    showNoResultsAnimation() {
        const container = document.getElementById('blockchain-results');
        if (!container) return;
        
        container.innerHTML = `
            <div class="no-results-container">
                <div class="no-results-content">
                    <div class="no-results-icon">🔍</div>
                    <h3 class="no-results-title">KEIN ZERTIFIKAT GEFUNDEN</h3>
                    <div class="no-results-message">
                        <p>Deine Suche ergab keine Treffer in der Blockchain.</p>
                        <br>
                        <p>Überprüfe die Eingabe oder versuche es mit:</p>
                        <ul style="text-align: left; margin-top: 1rem; max-width: 300px; margin-left: auto; margin-right: auto;">
                            <li>• Produkt-ID (z.B. DEF4B7E9-B50B-4339-A379...)</li>
                            <li>• Block-ID (z.B. BLK-001)</li>
                            <li>• Eigentümer-Code (z.B. USR-ABC123)</li>
                            <li>• Produktname (z.B. AGAMA)</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        // Scroll zu den No Results
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    animateFoundBlocks() {
        const searchResultBlocks = document.querySelectorAll('.search-results-grid .block, #blockchain-results .block');
        
        searchResultBlocks.forEach((block, index) => {
            // Setze initiale Styles für ultra-smooth Animation
            block.style.opacity = '0';
            block.style.transform = 'translate3d(0, 25px, 0) scale(0.94)';
            block.style.filter = 'blur(2px)';
            
            setTimeout(() => {
                // Füge Smooth Animation zu jedem gefundenen Block hinzu
                block.classList.add('search-result-success', 'search-result-smooth');
                block.style.opacity = ''; // Entferne inline styles
                block.style.transform = '';
                block.style.filter = '';
                
                // Sanftes Haptic Feedback nur beim ersten Block
                if (index === 0 && 'vibrate' in navigator) {
                    navigator.vibrate([15, 10, 25]); // Ultra-sanftes Vibrationsmuster
                }
                
                // Scroll zum ersten gefundenen Block mit längerer Verzögerung
                if (index === 0) {
                    setTimeout(() => {
                        block.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }, 600);
                }
                
                // Entferne smooth Klasse nach Animation
                setTimeout(() => {
                    block.classList.remove('search-result-smooth');
                }, 1400);
                
            }, index * 40); // Ultra-smooth Staggered Timing: 40ms zwischen Blöcken
        });
    }
    
    clearSearch() {
        this.isSearchMode = false;
        this.searchResults = [];
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            // Entferne alle Search-Animationen
            searchInput.classList.remove(
                'search-animation-success', 
                'search-animation-not-found', 
                'search-input-error',
                'search-loading'
            );
        }
        
        // Smooth fade-out der Suchergebnisse
        this.fadeOutSearchResults();
        
        // Entferne Highlighting von allen Blöcken
        document.querySelectorAll('.block.highlighted').forEach(block => {
            block.classList.remove('highlighted');
        });
        
        // Rendere Blöcke ohne Highlighting
        this.renderBlocks();
        
        this.showToast('Suche gelöscht', 'success');
    }
    
    fadeOutSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer && resultsContainer.innerHTML !== '') {
            const searchBlocks = resultsContainer.querySelectorAll('.search-result-block');
            const wrapper = resultsContainer.querySelector('.search-results-wrapper');
            
            if (searchBlocks.length > 0 && wrapper) {
                // Material Design 3: Reverse-Order Exit (von hinten nach vorn)
                const blocksArray = Array.from(searchBlocks);
                const reversedBlocks = blocksArray.reverse();
                
                // Sequenzielle Verschwinden-Animation von hinten nach vorn
                reversedBlocks.forEach((block, index) => {
                    block.style.animation = `searchResultFadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards`; // MD3 Emphasized accelerate
                    block.style.animationDelay = `${index * 80}ms`; // 80ms Delay pro Block
                });
                
                // Container Collapse nach allen Block-Animationen
                const blockAnimationTime = (reversedBlocks.length * 80) + 200; // Delays + Animation
                setTimeout(() => {
                    wrapper.style.animation = 'containerCollapse 300ms cubic-bezier(0.4, 0, 1, 1) forwards';
                    
                    // Komplette Entfernung nach Container-Animation
                    setTimeout(() => {
                        resultsContainer.innerHTML = '';
                        resultsContainer.style.display = 'none';
                    }, 300);
                }, blockAnimationTime);
            } else {
                // Fallback: Sofortiges Entfernen wenn keine Blöcke vorhanden
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
        }
    }
    
    fadeOutSearchResultsAsync() {
        return new Promise((resolve) => {
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer && resultsContainer.innerHTML !== '') {
                const searchBlocks = resultsContainer.querySelectorAll('.search-result-block');
                const wrapper = resultsContainer.querySelector('.search-results-wrapper');
                
                if (searchBlocks.length > 0 && wrapper) {
                    // Material Design 3: Reverse-Order Exit (von hinten nach vorn)
                    const blocksArray = Array.from(searchBlocks);
                    const reversedBlocks = blocksArray.reverse();
                    
                    // Sequenzielle Verschwinden-Animation von hinten nach vorn
                    reversedBlocks.forEach((block, index) => {
                        block.style.animation = `searchResultFadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards`; // MD3 Emphasized accelerate
                        block.style.animationDelay = `${index * 80}ms`; // 80ms Delay pro Block
                    });
                    
                    // Container Collapse nach allen Block-Animationen
                    const blockAnimationTime = (reversedBlocks.length * 80) + 200; // Delays + Animation
                    setTimeout(() => {
                        wrapper.style.animation = 'containerCollapse 300ms cubic-bezier(0.4, 0, 1, 1) forwards';
                        
                        // Komplette Entfernung nach Container-Animation
                        setTimeout(() => {
                            resultsContainer.innerHTML = '';
                            resultsContainer.style.display = 'none';
                            resolve(); // Promise erfüllen nach kompletter Animation
                        }, 300);
                    }, blockAnimationTime);
                } else {
                    // Fallback: Sofortiges Entfernen wenn keine Blöcke vorhanden
                    resultsContainer.innerHTML = '';
                    resultsContainer.style.display = 'none';
                    resolve(); // Promise sofort erfüllen
                }
            } else {
                resolve(); // Promise erfüllen wenn keine Ergebnisse vorhanden
            }
        });
    }
    
    animateSearchResultBlocks() {
        const searchBlocks = document.querySelectorAll('.search-result-block');
        
        searchBlocks.forEach((block, index) => {
            // Setze initiale Werte (unsichtbar und klein)
            block.style.opacity = '0';
            block.style.transform = 'scale(0.5)';
            block.style.animation = 'none';
            
            // Force reflow
            block.offsetHeight;
            
            // Starte Animation mit Delay (sequenziell wie im Beispiel)
            block.style.animation = `searchResultFadeIn 0.6s ease-out forwards`;
            block.style.animationDelay = `${index * 0.1}s`; // 0.1s Delay pro Block
            
            // Optional: Pulse-Effekt nach der Haupt-Animation
            setTimeout(() => {
                block.classList.add('pulse-highlight');
                
                // Entferne Pulse nach 1 Sekunde
                setTimeout(() => {
                    block.classList.remove('pulse-highlight');
                }, 1000);
            }, (index * 100) + 600); // Nach der fadeIn Animation
        });
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
        
        // IMMER alle Blöcke anzeigen, nicht nur Suchergebnisse
        let blocksToRender = this.blocks;
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            blocksToRender = blocksToRender.filter(block => 
                block.transactionType === this.currentFilter
            );
        }
        
        const viewClass = this.currentView === 'grid' ? 'blockchain-grid' : 'blockchain-chain';
        
        // Erstelle Set mit IDs der Suchergebnisse für Highlighting
        const searchResultIds = new Set(this.searchResults.map(block => block.blockId));
        
        container.innerHTML = `
            <div class="${viewClass}">
                ${blocksToRender.map(block => {
                    // Highlight nur wenn in Suchergebnissen UND Suchmodus aktiv
                    const shouldHighlight = this.isSearchMode && searchResultIds.has(block.blockId);
                    return this.renderBlock(block, shouldHighlight);
                }).join('')}
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
        if (!resultsContainer) return;
        
        if (this.searchResults.length > 0) {
            // Erstelle die Suchergebnis-Anzeige
            const searchResultsHTML = `
                <div class="search-results-wrapper">
                    <div class="search-results-header">
                        <h3>${this.searchResults.length} ${this.searchResults.length === 1 ? 'BLOCK' : 'BLÖCKE'} GEFUNDEN</h3>
                        <button class="clear-search-btn" onclick="blockchainExplorer.clearSearch()">
                            <span>✕</span> SUCHE LÖSCHEN
                        </button>
                    </div>
                    <div class="search-results-grid">
                        ${this.searchResults.slice(0, 8).map((block, index) => {
                            const date = new Date(block.timestamp).toLocaleDateString('de-DE');
                            const typeClass = block.transactionType.toLowerCase();
                            return `
                                <div class="search-result-block ${typeClass}" 
                                     data-block-id="${block.blockId}">
                                    <div class="result-block-header">
                                        <span class="result-block-id">${block.blockId}</span>
                                        <span class="result-block-type">${block.transactionType}</span>
                                    </div>
                                    <div class="result-block-product">
                                        ${block.metadata?.productName || block.productId}
                                    </div>
                                    <div class="result-block-date">${date}</div>
                                </div>
                            `;
                        }).join('')}
                        ${this.searchResults.length > 8 ? `
                            <div class="search-results-more">
                                +${this.searchResults.length - 8} weitere
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // Container mit Expand-Animation anzeigen
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = searchResultsHTML;
            
            // Starte Container Expand Animation
            const wrapper = resultsContainer.querySelector('.search-results-wrapper');
            if (wrapper) {
                // MD3 Emphasized decelerate für Enter-Animation (400ms)
                wrapper.style.animation = 'containerExpand 400ms cubic-bezier(0, 0, 0.2, 1) forwards';
                
                // Nach Container-Animation: Starte Block-Animationen
                setTimeout(() => {
                    this.animateSearchResultBlocks();
                }, 250); // Leichter Overlap für flüssigen Übergang
            } else {
                // Fallback falls kein wrapper gefunden wird
                this.animateSearchResultBlocks();
            }
            
            // Click listeners werden nach Block-Animation hinzugefügt
            setTimeout(() => {
                this.addClickListenersToResultBlocks();
            }, 800); // Nach allen Animationen
        }
    }
    
    renderBlock(block, isHighlighted = false) {
        const date = new Date(block.timestamp).toLocaleDateString('de-DE');
        const time = new Date(block.timestamp).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const typeClass = block.transactionType.toLowerCase();
        // Nur highlighten wenn explizit markiert
        const highlightClass = isHighlighted ? 'highlighted' : '';
        
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
        const dateShort = new Date(block.timestamp).toLocaleDateString('de-DE');
        const timeShort = new Date(block.timestamp).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Simulierter Kaufpreis (später aus Backend)
        const mockPrice = this.generateMockPrice(block.metadata?.productName);
        
        detailsContainer.innerHTML = `
            <!-- Kompakter Header -->
            <div class="detail-header">
                <div class="detail-header-left">
                    <div class="block-id-badge">${block.blockId}</div>
                    <div class="transaction-type-badge ${block.transactionType.toLowerCase()}">${block.transactionType}</div>
                </div>
                <div class="detail-header-right">
                    <div class="block-number">#${block.blockNumber}</div>
                    <div class="timestamp-compact">${dateShort} ${timeShort}</div>
                </div>
            </div>
            
            <!-- Produkt-Info Kompakt -->
            <div class="product-info-compact">
                <div class="product-primary">
                    <h3 class="product-name">${block.metadata?.productName || 'Unknown Product'}</h3>
                    <div class="serial-number">${block.metadata?.serialNumber || 'N/A'}</div>
                </div>
                <div class="product-secondary">
                    <div class="product-id-short" title="${block.productId}">
                        ${block.productId.substring(0, 8)}...
                    </div>
                </div>
            </div>
            
            <!-- Ownership Transfer mit Price Toggle -->
            <div class="ownership-section">
                <div class="ownership-flow">
                    ${block.fromOwner ? `
                        <div class="owner-card from">
                            <div class="owner-label">VON</div>
                            <div class="owner-code">${block.fromOwner}</div>
                        </div>
                        <div class="transfer-arrow">→</div>
                    ` : `
                        <div class="owner-card mint">
                            <div class="owner-label">MINT</div>
                            <div class="mint-text">Erstausgabe</div>
                        </div>
                        <div class="transfer-arrow">→</div>
                    `}
                    <div class="owner-card to">
                        <div class="owner-label">AN</div>
                        <div class="owner-code">${block.toOwner}</div>
                    </div>
                </div>
                
                <!-- Price Toggle (nur bei Transfers) -->
                ${block.transactionType === 'TRANSFER' ? `
                    <div class="price-section">
                        <div class="price-toggle-container">
                            <label class="price-toggle-label">
                                <span>Kaufpreis anzeigen</span>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="price-toggle-${block.blockId}" 
                                           onchange="blockchainExplorer.togglePriceVisibility('${block.blockId}', ${mockPrice})"
                                           checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                        <div class="price-display" id="price-display-${block.blockId}">
                            <span class="price-label">Kaufpreis:</span>
                            <span class="price-value" id="price-value-${block.blockId}">${mockPrice}€</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Technical Details (Collapsible) -->
            <div class="technical-section">
                <button class="technical-toggle" onclick="this.parentElement.classList.toggle('expanded')">
                    <span>Technische Details</span>
                    <span class="toggle-icon">▼</span>
                </button>
                <div class="technical-content">
                    <div class="hash-grid">
                        <div class="hash-item">
                            <div class="hash-label">Previous Hash</div>
                            <div class="hash-value" title="${block.previousHash}">
                                ${block.previousHash.substring(0, 16)}...
                            </div>
                        </div>
                        <div class="hash-item">
                            <div class="hash-label">Current Hash</div>
                            <div class="hash-value" title="${block.currentHash}">
                                ${block.currentHash.substring(0, 16)}...
                            </div>
                        </div>
                    </div>
                    ${block.metadata?.transferMethod ? `
                        <div class="transfer-method">
                            <span class="method-label">Transfer Method:</span>
                            <span class="method-value">${block.metadata.transferMethod}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.addDetailModalStyles();
        modal.classList.add('active');
        
        // Integration mit globalem Modal History Manager
        if (window.modalHistoryManager) {
            window.modalHistoryManager.openModal(
                'block-modal',
                () => this.closeModal(),
                { blockId: block.blockId, block: block }
            );
        } else {
            document.body.style.overflow = 'hidden';
        }
    }
    
    generateMockPrice(productName) {
        // Simulierte Preise basierend auf Produktname
        const prices = {
            'AGAMA': 149,
            'AURORA': 179,
            'CASH4LOVE': 129,
            'CRUELLA': 499,
            'GOLDELSE': 79,
            'SNAKE-EATER': 89,
            'BRUTALIST RING': 169
        };
        return prices[productName] || Math.floor(Math.random() * 200) + 50;
    }
    
    togglePriceVisibility(blockId, price) {
        const checkbox = document.getElementById(`price-toggle-${blockId}`);
        const priceValue = document.getElementById(`price-value-${blockId}`);
        
        if (checkbox && priceValue) {
            if (checkbox.checked) {
                priceValue.textContent = `${price}€`;
                priceValue.classList.remove('hidden');
            } else {
                priceValue.textContent = 'XXX€';
                priceValue.classList.add('hidden');
            }
        }
    }
    
    addDetailModalStyles() {
        if (document.getElementById('detail-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'detail-modal-styles';
        style.textContent = `
            /* Kompakter Detail Header */
            .detail-header {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 1rem;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .detail-header-left {
                display: flex;
                gap: 0.75rem;
                align-items: center;
            }
            
            .detail-header-right {
                text-align: right;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .block-id-badge {
                background: rgba(0, 255, 0, 0.15);
                border: 1px solid #00ff00;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                color: #00ff00;
                font-family: monospace;
            }
            
            .transaction-type-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .transaction-type-badge.mint {
                background: rgba(0, 150, 255, 0.15);
                color: #0096ff;
                border: 1px solid #0096ff;
            }
            
            .transaction-type-badge.transfer {
                background: rgba(255, 150, 0, 0.15);
                color: #ff9600;
                border: 1px solid #ff9600;
            }
            
            .block-number {
                font-size: 1.1rem;
                font-weight: 500;
                color: #fff;
            }
            
            .timestamp-compact {
                font-size: 0.8rem;
                color: #999;
                font-family: monospace;
            }
            
            /* Kompakte Produkt-Info */
            .product-info-compact {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 1rem;
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .product-name {
                font-size: 1.2rem;
                font-weight: 500;
                color: #fff;
                margin: 0 0 0.25rem 0;
                letter-spacing: 0.05em;
            }
            
            .serial-number {
                font-size: 0.9rem;
                color: #999;
                font-family: monospace;
            }
            
            .product-id-short {
                font-size: 0.8rem;
                color: #666;
                font-family: monospace;
                cursor: help;
                padding: 0.25rem 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            /* Ownership Section */
            .ownership-section {
                margin-bottom: 1.5rem;
            }
            
            .ownership-flow {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1rem;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .owner-card {
                flex: 1;
                text-align: center;
                padding: 0.75rem;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.02);
            }
            
            .owner-card.from {
                border-color: rgba(255, 150, 0, 0.3);
                background: rgba(255, 150, 0, 0.05);
            }
            
            .owner-card.to {
                border-color: rgba(0, 255, 0, 0.3);
                background: rgba(0, 255, 0, 0.05);
            }
            
            .owner-card.mint {
                border-color: rgba(0, 150, 255, 0.3);
                background: rgba(0, 150, 255, 0.05);
            }
            
            .owner-label {
                font-size: 0.7rem;
                color: #999;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 0.25rem;
            }
            
            .owner-code {
                font-family: monospace;
                font-size: 0.9rem;
                font-weight: 500;
                color: #fff;
            }
            
            .mint-text {
                font-size: 0.9rem;
                color: #0096ff;
                font-weight: 500;
            }
            
            .transfer-arrow {
                font-size: 1.2rem;
                color: #00ff00;
                font-weight: 500;
                flex-shrink: 0;
            }
            
            /* Price Toggle */
            .price-section {
                padding: 1rem;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .price-toggle-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.75rem;
            }
            
            .price-toggle-label {
                display: flex;
                align-items: center;
                gap: 1rem;
                cursor: pointer;
                font-size: 0.9rem;
                color: #ccc;
            }
            
            .toggle-switch {
                position: relative;
                width: 44px;
                height: 24px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.1);
                transition: 0.3s;
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 2px;
                bottom: 2px;
                background: #666;
                transition: 0.3s;
                border-radius: 50%;
            }
            
            .toggle-switch input:checked + .toggle-slider {
                background: rgba(0, 255, 0, 0.2);
                border-color: #00ff00;
            }
            
            .toggle-switch input:checked + .toggle-slider:before {
                transform: translateX(20px);
                background: #00ff00;
            }
            
            .price-display {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .price-label {
                font-size: 0.9rem;
                color: #999;
            }
            
            .price-value {
                font-size: 1.1rem;
                font-weight: 500;
                color: #00ff00;
                font-family: monospace;
                transition: all 0.3s;
            }
            
            .price-value.hidden {
                color: #ff4444;
            }
            
            /* Technical Section */
            .technical-section {
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            
            .technical-toggle {
                width: 100%;
                background: rgba(255, 255, 255, 0.02);
                border: none;
                padding: 1rem;
                color: #ccc;
                font-size: 0.9rem;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s;
            }
            
            .technical-toggle:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #fff;
            }
            
            .toggle-icon {
                transition: transform 0.3s;
                font-size: 0.8rem;
            }
            
            .technical-section.expanded .toggle-icon {
                transform: rotate(180deg);
            }
            
            .technical-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: rgba(0, 0, 0, 0.2);
            }
            
            .technical-section.expanded .technical-content {
                max-height: 200px;
                padding: 1rem;
            }
            
            .hash-grid {
                display: grid;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .hash-item {
                display: grid;
                grid-template-columns: 100px 1fr;
                gap: 0.5rem;
                align-items: center;
            }
            
            .hash-label {
                font-size: 0.8rem;
                color: #999;
                text-transform: uppercase;
            }
            
            .hash-value {
                font-family: monospace;
                font-size: 0.8rem;
                color: #fff;
                background: rgba(255, 255, 255, 0.05);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                cursor: help;
            }
            
            .transfer-method {
                padding-top: 0.75rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 0.9rem;
            }
            
            .method-label {
                color: #999;
            }
            
            .method-value {
                color: #fff;
                font-weight: 500;
                margin-left: 0.5rem;
            }
            
            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .detail-header {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .detail-header-right {
                    text-align: left;
                    flex-direction: row;
                    justify-content: space-between;
                }
                
                .product-info-compact {
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }
                
                .ownership-flow {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .transfer-arrow {
                    transform: rotate(90deg);
                }
                
                .hash-item {
                    grid-template-columns: 1fr;
                    gap: 0.25rem;
                }
                
                .price-toggle-container {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    closeModal() {
        const modal = document.getElementById('block-modal');
        if (modal) {
            modal.classList.remove('active');
            
            // Integration mit globalem Modal History Manager
            if (window.modalHistoryManager) {
                window.modalHistoryManager.closeModal('block-modal', () => {
                    // Modal ist bereits geschlossen, nur cleanup
                    document.body.style.overflow = '';
                });
            } else {
                document.body.style.overflow = '';
            }
        }
    }
    
    addClickListenersToResultBlocks() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.querySelectorAll('.search-result-block').forEach(blockEl => {
                blockEl.addEventListener('click', () => {
                    const blockId = blockEl.dataset.blockId;
                    const block = this.searchResults.find(b => b.blockId === blockId);
                    if (block) {
                        this.showBlockDetails(block);
                    }
                });
            });
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
            success: '#00ff00',
            error: '#ff4444',
            warning: '#ffaa00'
        };
        
        const backgrounds = {
            info: 'rgba(0, 255, 0, 0.1)',
            success: 'rgba(0, 255, 0, 0.15)',
            error: 'rgba(255, 68, 68, 0.15)',
            warning: 'rgba(255, 170, 0, 0.15)'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100%);
            background: ${backgrounds[type] || backgrounds.info};
            backdrop-filter: blur(10px);
            color: ${colors[type] || colors.info};
            border: 2px solid ${colors[type] || colors.info};
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 400;
            z-index: 10000;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            max-width: 350px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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