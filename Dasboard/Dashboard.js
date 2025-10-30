document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthentication();
    
    // Initialize sidebar toggle
    initializeSidebar();
    
    // Initialize logout functionality
    initializeLogout();
    
    // Initialize chart
    initializeChart();
    
    // Load dashboard data
    loadDashboardData();
});

function checkAuthentication() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '../SignIn/Sign-In.html';
        return;
    }
    
    // Display welcome message with username
    const userData = JSON.parse(user);
    document.querySelector('h2').textContent = `Welcome back, ${userData.username || 'Trader'}!`;
}

function initializeSidebar() {
    const toggleBtn = document.getElementById('toogleBtn');
    const sidebar = document.getElementById('sidebar');
    
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        
        // Update button text based on state
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.textContent = '☰';
        } else {
            toggleBtn.textContent = '✕';
        }
    });
}

function initializeLogout() {
    const logoutBtn = document.getElementById('logout');
    
    logoutBtn.addEventListener('click', function() {
        // Clear authentication data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to sign-in page
        window.location.href = '../SignIn/Sign-In.html';
    });
}

function initializeChart() {
    const ctx = document.getElementById('profilechart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Portfolio Value',
                data: [100, 150, 130, 200, 180, 250],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Trading Performance'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function loadDashboardData() {
    // In a real app, you would fetch this from your backend API
    // For now, we'll use mock data
    
    const mockData = {
        balance: 200.00,
        activeTrades: 2,
        profitLoss: 50.00,
        apiKeys: 1
    };
    
    // Update dashboard stats
    document.getElementById('Balance').textContent = `$${mockData.balance.toFixed(2)}`;
    document.getElementById('trades').textContent = mockData.activeTrades;
    document.getElementById('profit-loss').textContent = `$${mockData.profitLoss.toFixed(2)}`;
    document.getElementById('keys').textContent = mockData.apiKeys;
    
    // In real app, you would fetch recent activity from API
    // For now, we'll keep the static HTML data
}

// Add CSS for collapsed sidebar
const sidebarStyles = `
    .sidebar.collapsed {
        width: 70px;
    }
    
    .sidebar.collapsed .logo-section,
    .sidebar.collapsed .nav-links li span,
    .sidebar.collapsed .logout-btn span {
        display: none;
    }
    
    .sidebar.collapsed .nav-links li a {
        justify-content: center;
        padding: 15px;
    }
    
    .sidebar.collapsed .logout-btn {
        justify-content: center;
        padding: 15px;
    }
    
    .main-content {
        transition: margin-left 0.3s ease;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = sidebarStyles;
document.head.appendChild(styleSheet);