    addDetailModalStyles() {
        if (document.getElementById('detail-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'detail-modal-styles';
        style.textContent = `
            /* Responsive Grid Layout für Block Details */
            .detail-content-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                padding: 0;
            }
            
            .main-info-card,
            .timestamp-card,
            .ownership-card,
            .technical-card {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 1rem;
            }
            
            .main-info-card {
                grid-column: 1 / -1; /* Spans both columns */
            }
            
            .info-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            
            .product-name {
                color: #fff;
                font-size: 1.1rem;
                font-weight: 600;
                margin: 0;
            }
            
            .transaction-type-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .transaction-type-badge.mint {
                background: rgba(34, 197, 94, 0.2);
                color: #22c55e;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }
            
            .transaction-type-badge.transfer {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
                border: 1px solid rgba(59, 130, 246, 0.3);
            }
            
            .info-meta {
                display: flex;
                justify-content: space-between;
                color: #999;
                font-size: 0.85rem;
            }
            
            .serial-number {
                color: #00ff00;
                font-family: 'Courier New', monospace;
            }
            
            .block-id {
                color: #ccc;
                font-family: 'Courier New', monospace;
            }
            
            .timestamp-card .timestamp-label,
            .ownership-card .ownership-label,
            .technical-card .technical-label {
                color: #ccc;
                font-size: 0.8rem;
                text-transform: uppercase;
                margin-bottom: 0.5rem;
                display: block;
                font-weight: 600;
            }
            
            .timestamp-value {
                color: #fff;
                font-size: 0.9rem;
                font-family: 'Courier New', monospace;
            }
            
            .ownership-flow {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .owner-item, .mint-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .owner-label, .mint-label {
                color: #999;
                font-size: 0.8rem;
            }
            
            .owner-code {
                color: #3b82f6;
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .mint-label {
                color: #22c55e;
                font-weight: 500;
            }
            
            .transfer-arrow {
                text-align: center;
                color: #666;
                font-size: 0.8rem;
                margin: 0.25rem 0;
            }
            
            .hash-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .hash-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .hash-label {
                color: #999;
                font-size: 0.8rem;
                min-width: 70px;
            }
            
            .hash-value {
                color: #666;
                font-family: 'Courier New', monospace;
                font-size: 0.75rem;
                background: rgba(0, 0, 0, 0.3);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: color 0.2s ease;
            }
            
            .hash-value:hover {
                color: #999;
            }
            
            .transfer-method-info {
                margin-top: 0.75rem;
                padding-top: 0.75rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .method-label {
                color: #999;
                font-size: 0.8rem;
            }
            
            .method-value {
                color: #3b82f6;
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            /* Mobile Layout */
            @media (max-width: 768px) {
                .detail-content-grid {
                    grid-template-columns: 1fr;
                    gap: 0.75rem;
                }
                
                .main-info-card {
                    grid-column: 1;
                }
                
                .info-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .owner-code {
                    max-width: 100px;
                }
            }
        `;
        document.head.appendChild(style);
    }