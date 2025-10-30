// register.js - Professional Registration
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };

    // Clear previous errors
    clearErrors();

    // Validate form
    if (!validateForm(formData)) return;

    try {
        // Show loading state
        const button = document.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Creating Account...';

        // Send to backend API
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = '../SignIn/Sign-In.html?email=' + encodeURIComponent(formData.email);
            }, 1500);
        } else {
            handleRegistrationError(data);
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
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
    } else if (!isValidEmail(email)) {
        showError('email', 'Please enter a valid email');
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    
    const formGroup = field.closest('.form-group');
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(error => error.remove());
}

function handleRegistrationError(data) {
    if (data.error === 'EMAIL_EXISTS') {
        showError('email', 'An account with this email already exists');
    } else if (data.error === 'USERNAME_TAKEN') {
        showError('username', 'Username is already taken');
    } else {
        showNotification(data.message || 'Registration failed', 'error');
    }
}

function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className =`notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        background-color: ${type === 'success' ? '#1ec58eff' : '#ef4444'};
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

// Add CSS for errors
const style = document.createElement('style');
style.textContent = `
    .error { border-color: #ef4444 !important; background-color: #fef2f2; }
    .error-message { color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; }
`;
document.head.appendChild(style);