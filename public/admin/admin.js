const API_URL = '/api';

// --- AUTH ---
const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

// --- AUTH ---
async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/check-auth`);
        if (res.ok) {
            showDashboard();
        } else {
            showLogin();
        }
    } catch (err) {
        showLogin();
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            showDashboard();
        } else {
            alert('Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        alert('Error logging in');
    }
});

function showLogin() {
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
}

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    loadProjects();
    loadCerts();
}

async function logout() {
    await fetch(`${API_URL}/logout`, { method: 'POST' });
    location.reload();
}

// Check auth on load
checkAuth();

// --- TABS ---
function switchTab(tabId) {
    document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Highlight button
    const buttons = document.querySelectorAll('.tab-btn');
    if (tabId === 'projects-view') buttons[0].classList.add('active');
    else buttons[1].classList.add('active');
}


// --- PROJECTS ---
async function loadProjects() {
    const res = await fetch(`${API_URL}/projects`);
    const projects = await res.json();
    const list = document.getElementById('projects-list');
    list.innerHTML = projects.map(p => `
        <div class="list-item">
            <div class="item-info">
                ${p.image_url ? `<img src="${p.image_url}">` : ''}
                <div>
                    <h3>${p.title}</h3>
                    <p style="color:#aaa; font-size:0.8rem;">${p.short_description || ''}</p>
                </div>
            </div>
            <div class="actions">
                <button class="btn-delete" onclick="deleteProject('${p.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('p-title').value);
    formData.append('short_description', document.getElementById('p-short-desc').value);

    // Tech stack, demo_url, and repo_url are currently ignored in this minimal Appwrite migration
    // unless you add these attributes to your Appwrite collection.

    const fileInput = document.getElementById('p-image');
    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    await fetch(`${API_URL}/projects`, {
        method: 'POST',
        body: formData
    });

    closeModals();
    loadProjects();
    e.target.reset();
});

async function deleteProject(id) {
    if (!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
    loadProjects();
}


// --- CERTIFICATES (Disabled/Static) ---
async function loadCerts() {
    // Return or show a message that certificates are managed in HTML
    const list = document.getElementById('certs-list');
    list.innerHTML = '<p style="padding: 20px; color:#888;">Certificates are now static. Update them directly in index.html.</p>';
}

document.getElementById('cert-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Certificates are now static. Please update the index.html file to manage your certificates.');
});

async function deleteCert(id) {
    alert('Action disabled. Certificates are now static.');
}


// --- MODALS ---
function openProjectModal() {
    document.getElementById('project-modal').classList.add('active');
}
function openCertModal() {
    document.getElementById('cert-modal').classList.add('active');
}
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}
