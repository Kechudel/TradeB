document.addEventListener('DOMContentLoaded', function() {
    const signInForm = document.getElementById('SignInForm');
    
    signInForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Get form data
        const formData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };
        
        // Validate form
        if (!validateForm(formData)) {
            return;
        }
        
        // Attempt login
        await handleSignIn(formData);
    });
    
    // Auto-focus on email field when page loads
    document.getElementById('email').focus();
});

// Form validation
function validateForm(formData) {
    const { email, password } = formData;
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    // Email validation
    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showError('password', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

// Email format validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Error handling functions
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Add error class to input
    field.classList.add('error');
    
    // Create or update error message
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearErrors() {
    // Remove error styling
    document.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });
    
    // Remove error messages
    document.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
}

// Main sign-in function
async function handleSignIn(formData) {
    const submitButton = document.querySelector('button[type="submit"]');
    
    try {
        // Show loading state
        setButtonLoadingState(submitButton, true);
        
        // Send request to backend
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            await handleSuccessResponse(data);
        } else {
            handleErrorResponse(data, response.status);
        }
        
    } catch (error) {
        handleNetworkError(error);
    } finally {
        // Reset button state
        setButtonLoadingState(submitButton, false);
    }
}

// Handle successful login
async function handleSuccessResponse(data) {
    // Store authentication data (backend should provide token and user info)
    if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Show success message
    showNotification('Welcome back! Sign in successful.', 'success');
    
    // Redirect to dashboard after a brief delay
    setTimeout(() => {
        window.location.href = '../Dashboard/Dashboard.html';
    }, 1500);
}

// Handle error responses from backend
function handleErrorResponse(data, statusCode) {
    switch (statusCode) {
        case 400:
            showError('email', data.message || 'Invalid request');
            break;
        case 401:
            if (data.error === 'INVALID_CREDENTIALS') {
                showError('password', 'Invalid email or password');
            } else {
                showNotification('Authentication failed. Please try again.', 'error');
            }
            break;
        case 404:
            showError('email', 'No account found with this email');
            break;
        case 423:
            showNotification('Account locked. Please contact support.', 'error');
            break;
        case 429:
            showNotification('Too many attempts. Please try again later.', 'error');
            break;
        case 500:
            showNotification('Server error. Please try again later.', 'error');
            break;
        default:
            showNotification(data.message || 'Sign in failed. Please try again.', 'error');
    }
}

// Handle network errors
function handleNetworkError(error) {
    console.error('Network error:', error);
    showNotification('Network error. Please check your connection.', 'error');
}

// UI helper functions
function setButtonLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Signing In...';
    } else {
        button.disabled = false;
        button.textContent = 'Sign In';
    }
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        fontFamily: 'inherit'
    });
    
    // Close button styles
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.background = 'none',
    closeBtn.style.border = 'none',
    closeBtn.style.color = 'white',
    closeBtn.style.cursor = 'pointer',
    closeBtn.style.fontSize = '1.2rem',
    closeBtn.style.padding = '0',
    closeBtn.style.width = '24px',
    closeBtn.style.height = '24px'
    
    // Close functionality
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Loading spinner styles
const spinnerStyles = `
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .error {
        border-color: #ef4444 !important;
        background-color: #fef2f2;
    }
    
    .error-message {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        font-weight: 500;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = spinnerStyles;
document.head.appendChild(styleSheet);

// Check if user is already logged in (optional)
function checkExistingSession() {
    const token = localStorage.getItem('accessToken');
    if (token) {
        // Optional: Validate token with backend or redirect directly
        // window.location.href = '/dashboard.html';
    }
}

// Initialize session check
checkExistingSession();