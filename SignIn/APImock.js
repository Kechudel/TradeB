// Sign-In.js - Complete with built-in mock backend
class MockBackend {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    }

    async delay(ms = 800) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async login(credentials) {
        await this.delay();
        
        const user = this.users.find(u => u.email === credentials.email);
        if (!user) {
            throw { error: 'USER_NOT_FOUND', message: 'User not found' };
        }

        if (user.password !== credentials.password) {
            throw { error: 'INVALID_PASSWORD', message: 'Invalid password' };
        }

        return {
            accessToken: 'mock-jwt-token-' + Date.now(),
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };
    }
}

// Initialize mock backend
const mockBackend = new MockBackend();

document.addEventListener('DOMContentLoaded', function() {
    const signInForm = document.getElementById('SignInForm');
    
    // Check if already logged in
    if (localStorage.getItem('accessToken')) {
        window.location.href = '../Dashboard.html';
        return;
    }
    
    signInForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };
        
        if (!validateForm(formData)) return;
        await handleSignIn(formData);
    });
    
    // Auto-fill email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        document.getElementById('email').value = email;
        document.getElementById('password').focus();
    }
});

function validateForm(formData) {
    const { email, password } = formData;
    let isValid = true;
    
    clearErrors();
    
    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Please enter valid email');
        isValid = false;
    }
    
    if (!password) {
        showError('password', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

async function handleSignIn(formData) {
    const button = document.querySelector('button[type="submit"]');
    
    try {
        button.disabled = true;
        button.textContent = 'Signing In...';
        
        const response = await mockBackend.login(formData);
        
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        showNotification('Welcome back! Sign in successful.', 'success');
        
        setTimeout(() => {
            window.location.href = '../Dashboard.html';
        }, 1500);
        
    } catch (error) {
        handleLoginError(error);
    } finally {
        button.disabled = false;
        button.textContent = 'Sign In';
    }
}

function handleLoginError(error) {
    switch (error.error) {
        case 'USER_NOT_FOUND':
            showError('email', 'No account found with this email');
            break;
        case 'INVALID_PASSWORD':
            showError('password', 'Incorrect password');
            break;
        default:
            showNotification(error.message || 'Sign in failed', 'error');
    }
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    
    let errorElement = field.parentElement.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(error => error.remove());
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

// Add error styles
const style = document.createElement('style');
style.textContent = `
    .error { border-color: #ef4444 !important; background-color: #fef2f2; }
    .error-message { color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; }
`;
document.head.appendChild(style);