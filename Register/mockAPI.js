// register.js - Complete with built-in mock backend
class MockBackend {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    }

    async delay(ms = 800) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async register(userData) {
        await this.delay();
        
        const existingUser = this.users.find(user => user.email === userData.email);
        if (existingUser) {
            throw { error: 'EMAIL_EXISTS', message: 'User already exists' };
        }

        const newUser = {
            id: Date.now().toString(),
            username: userData.username,
            email: userData.email,
            password: userData.password,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(this.users));

        return {
            accessToken: 'mock-jwt-token-' + Date.now(),
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        };
    }
}

// Initialize mock backend
const mockBackend = new MockBackend();

// Form submission
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };

    clearErrors();
    if (!validateForm(formData)) return;

    try {
        const button = document.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Creating Account...';

        const response = await mockBackend.register(formData);
        
        showNotification('Account created successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = '../SignIn/Sign-In.html?email=' + encodeURIComponent(formData.email);
        }, 1500);

    } catch (error) {
        handleRegistrationError(error);
    } finally {
        const button = document.querySelector('button[type="submit"]');
        button.disabled = false;
        button.textContent = 'Register';
    }
});

function validateForm(formData) {
    const { username, email, password } = formData;
    let isValid = true;

    if (!username) {
        showError('username', 'Username is required');
        isValid = false;
    }

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
    } else if (password.length < 6) {
        showError('password', 'Password must be at least 6 characters');
        isValid = false;
    }

    return isValid;
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

function handleRegistrationError(error) {
    if (error.error === 'EMAIL_EXISTS') {
        showError('email', 'An account with this email already exists');
    } else {
        showNotification(error.message || 'Registration failed', 'error');
    }
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