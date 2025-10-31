document.addEventListener('DOMContentLoaded', function() {
    console.log('API Keys page loaded');
    
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }
    
    // Initialize components
    initializeLogout();
    initializeApiForm();
    loadConnectedExchanges();
});

function checkAuthentication() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '../SignIn/Sign-In.html';
        return false;
    }
    
    return true;
}

function initializeLogout() {
    const logoutBtn = document.getElementById('logout');
    
    logoutBtn.addEventListener('click', function() {
        // Call logout endpoint
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        }).finally(() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '../SignIn/Sign-In.html';
        });
    });
}

function initializeApiForm() {
    const apiForm = document.getElementById('apiForm');
    
    apiForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = {
            exchange: document.getElementById('exchangeSelect').value,
            apiKey: document.getElementById('apiKey').value.trim(),
            secretKey: document.getElementById('secretKey').value,
            // Optional: passphrase for exchanges that require it
            passphrase: document.getElementById('passphrase') ? document.getElementById('passphrase').value : undefined
        };
        
        clearStatusMessage();
        
        if (!validateApiForm(formData)) {
            return;
        }
        
        await connectApiKeys(formData);
    });
}

function validateApiForm(formData) {
    const { exchange, apiKey, secretKey } = formData;
    
    if (!exchange) {
        showStatusMessage('Please select an exchange', 'error');
        return false;
    }
    
    if (!apiKey) {
        showStatusMessage('API Key is required', 'error');
        return false;
    }
    
    if (!secretKey) {
        showStatusMessage('Secret Key is required', 'error');
        return false;
    }
    
    return true;
}

async function connectApiKeys(formData) {
    const submitButton = document.querySelector('#apiForm button[type="submit"]');
    
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Connecting...';
        
        const response = await fetch('/api/exchanges/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatusMessage(`Successfully connected to ${getExchangeName(formData.exchange)}!`, 'success');
            
            // Reset form
            document.getElementById('apiForm').reset();
            
            // Reload connected exchanges
            loadConnectedExchanges();
            
        } else {
            handleApiError(response.status, data);
        }
        
    } catch (error) {
        console.error('Network error:', error);
        showStatusMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Connect';
    }
}

async function loadConnectedExchanges() {
    try {
        const response = await fetch('/api/exchanges', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        
        if (response.ok) {
            const exchanges = await response.json();
            displayConnectedExchanges(exchanges);
        } else if (response.status !== 404) {
            console.error('Failed to load exchanges:', response.status);
        }
    } catch (error) {
        console.error('Error loading exchanges:', error);
    }
}

function displayConnectedExchanges(exchanges) {
    // Remove existing exchanges display if any
    const existingDisplay = document.getElementById('connectedExchanges');
    if (existingDisplay) {
        existingDisplay.remove();
    }
    
    if (!exchanges || exchanges.length === 0) {
        return;
    }
    
    const apikeysSection = document.querySelector('.apikeys-section');
    const exchangesHtml = `
        <div id="connectedExchanges" class="connected-exchanges">
            <h3>Connected Exchanges</h3>
            <div class="exchanges-list">
                ${exchanges.map(exchange => `
                    <div class="exchange-item" data-exchange-id="${exchange.id}">
                        <div class="exchange-info">
                            <span class="exchange-name">${getExchangeName(exchange.exchange)}</span>
                            <span class="exchange-status ${exchange.status}">${exchange.status}</span>
                        </div>
                        <div class="exchange-actions">
                            <span class="connected-date">Connected: ${new Date(exchange.connectedAt).toLocaleDateString()}</span>
                            <button class="btn-disconnect" onclick="disconnectExchange('${exchange.id}')">Disconnect</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Insert after the form
    apikeysSection.insertAdjacentHTML('beforeend', exchangesHtml);
}

async function disconnectExchange(exchangeId) {
    if (!confirm('Are you sure you want to disconnect this exchange? This will stop all trading bots using these keys.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/exchanges/${exchangeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        
        if (response.ok) {
            showStatusMessage('Exchange disconnected successfully', 'success');
            loadConnectedExchanges(); // Reload the list
        } else {
            const data = await response.json();
            showStatusMessage(data.message || 'Failed to disconnect exchange', 'error');
        }
    } catch (error) {
        console.error('Error disconnecting exchange:', error);
        showStatusMessage('Network error while disconnecting', 'error');
    }
}

function handleApiError(statusCode, data) {
    switch (statusCode) {
        case 400:
            showStatusMessage(data.message || 'Invalid API key format', 'error');
            break;
        case 401:
            showStatusMessage('Session expired. Please login again.', 'error');
            setTimeout(() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '../SignIn/Sign-In.html';
            }, 2000);
            break;
        case 403:
            showStatusMessage('Insufficient API key permissions', 'error');
            break;
        case 409:
            showStatusMessage('API keys for this exchange are already connected', 'error');
            break;
        case 422:
            showStatusMessage(data.message || 'API key validation failed', 'error');
            break;
        case 429:
            showStatusMessage('Too many attempts. Please try again later.', 'error');
            break;
        case 500:
            showStatusMessage('Server error. Please try again later.', 'error');
            break;
        default:
            showStatusMessage(data.message || 'Failed to connect API keys', 'error');
    }
}

function getExchangeName(exchangeCode) {
    const exchangeNames = {
        'alpaca': 'Alpaca',
        'binance': 'Binance',
        'coinbase': 'Coinbase',
        'kraken': 'Kraken',
        'kucoin': 'KuCoin',
        'bybit': 'Bybit',
        'okx': 'OKX',
        'gate': 'Gate.io',
        'mexc': 'MEXC',
        'bitget': 'Bitget',
        'coinbaseexchange': 'Coinbase Exchange',
        'cryptocom': 'Crypto.com',
        'gemini': 'Gemini',
        'poloniex': 'Poloniex',
        'bitstamp': 'Bitstamp',
        'bitmex': 'BitMEX',
        'deribit': 'Deribit',
        'phemex': 'Phemex'
    };
    
    return exchangeNames[exchangeCode] || exchangeCode.charAt(0).toUpperCase() + exchangeCode.slice(1);
}

function showStatusMessage(message, type) {
    const statusElement = document.getElementById('statusMessage');
    
    statusElement.textContent = '';
    statusElement.className = 'status-message';
    statusElement.classList.add(type);
    statusElement.textContent = message;
    
    if (type === 'success') {
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }
        }, 5000);
    }
}

function clearStatusMessage() {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = '';
    statusElement.className = 'status-message';
}

// Add production styles
const productionStyles = `
    .status-message {
        padding: 12px 16px;
        border-radius: 6px;
        margin: 16px 0;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .status-message.success {
        background-color: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }
    
    .status-message.error {
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }
    
    .status-message.info {
        background-color: #dbeafe;
        color: #1e40af;
        border: 1px solid #bfdbfe;
    }
    
    .connected-exchanges {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .connected-exchanges h3 {
        margin-bottom: 1rem;
        color: #1e293b;
    }
    
    .exchanges-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .exchange-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
    }
    
    .exchange-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .exchange-name {
        font-weight: 600;
        color: #1e293b;
    }
    
    .exchange-status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .exchange-status.connected {
        background: #d1fae5;
        color: #065f46;
    }
    
    .exchange-status.disconnected {
        background: #fef3c7;
        color: #92400e;
    }
    
    .exchange-status.error {
        background: #fee2e2;
        color: #dc2626;
    }
    
    .exchange-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .connected-date {
        font-size: 0.875rem;
        color: #64748b;
    }
    
    .btn-disconnect {
        padding: 0.5rem 1rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;
    }
    
    .btn-disconnect:hover {
        background: #dc2626;
    }
    
    #apiForm button[type="submit"]:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = productionStyles;
document.head.appendChild(styleSheet);
