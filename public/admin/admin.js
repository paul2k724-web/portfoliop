const API_URL = '/api';

// --- AUTH ---
const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');

// --- AUTH ---
async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/check-auth`, { credentials: 'include' });
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
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Authenticating...';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showDashboard();
        } else {
            alert(data.error || 'Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        alert('Connection error. Is the server running?');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
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
    await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
    document.cookie = "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
    try {
        const res = await fetch(`${API_URL}/projects`, { credentials: 'include' });
        const projects = await res.json();
        const list = document.getElementById('projects-list');
        list.innerHTML = projects.map(p => `
            <div class="list-item">
                <div class="item-info">
                    ${p.image_url ? `<img src="${p.image_url}">` : ''}
                    <div>
                        <h3>${p.title}</h3>
                        <p style="color:#aaa; font-size:0.8rem;">${p.short_description || ''}</p>
                        <div style="font-size:0.7rem; color:var(--primary-color); margin-top:5px;">
                            ${p.tech_stack ? p.tech_stack.join(', ') : ''}
                        </div>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-delete" onclick="deleteProject('${p.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Load Projects Error:", err);
    }
}

document.getElementById('project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const formData = new FormData();
    formData.append('title', document.getElementById('p-title').value);
    formData.append('short_description', document.getElementById('p-short-desc').value);
    formData.append('tech_stack', document.getElementById('p-tech-stack').value);
    formData.append('demo_url', document.getElementById('p-demo').value);
    formData.append('repo_url', document.getElementById('p-repo').value);

    const fileInput = document.getElementById('p-image');
    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            alert('Project saved successfully!');
            closeModals();
            loadProjects();
            e.target.reset();
        } else {
            alert('Error: ' + (data.error || 'Could not save project'));
        }
    } catch (err) {
        console.error("Save Project Error:", err);
        alert('Network error while saving project.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

async function deleteProject(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (data.success) {
            loadProjects();
        } else {
            alert('Error deleting project: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error("Delete Project Error:", err);
        alert('Network error while deleting project.');
    }
}


// --- CERTIFICATES ---
async function loadCerts() {
    try {
        const res = await fetch(`${API_URL}/certificates`, { credentials: 'include' });
        const certs = await res.json();
        const list = document.getElementById('certs-list');
        list.innerHTML = certs.map(c => `
            <div class="list-item">
                <div class="item-info">
                    ${c.image_url ? `<img src="${c.image_url}">` : '<div style="width:60px; height:60px; background:#333; border-radius:8px; margin-right:1rem; display:flex; align-items:center; justify-content:center;"><i class="fas fa-certificate"></i></div>'}
                    <div>
                        <h3>${c.title}</h3>
                        <p style="color:#aaa; font-size:0.8rem;">${c.issuer || ''} (${c.year || ''})</p>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-delete" onclick="deleteCert('${c.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Load Certs Error:", err);
    }
}

document.getElementById('cert-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('c-title').value);
    formData.append('issuer', document.getElementById('c-issuer').value);
    formData.append('year', document.getElementById('c-year')?.value || new Date().getFullYear()); // Assuming year input exists or fallback

    // Map fields from index.html if different
    const yearVal = document.getElementById('c-date').value ? new Date(document.getElementById('c-date').value).getFullYear() : new Date().getFullYear();
    formData.set('year', yearVal);

    // Note: The modal in index.html had c-date, c-status, c-url, c-progress.
    // Our Appwrite schema uses title, issuer, year, imageUrl.

    // We should probably allow an image upload for certificates too if we want it dynamic
    // Let's add an image field to the form in index.html or reuse a field.
    // For now, I'll use a placeholder or check if exists.
    const fileInput = document.getElementById('c-image'); // Need to add this to index.html
    if (fileInput && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/certificates`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            alert('Certificate saved successfully!');
            closeModals();
            loadCerts();
            e.target.reset();
        } else {
            alert('Error saving certificate: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error("Save Certificate Error:", err);
        alert('Network error while saving certificate.');
    }
});

async function deleteCert(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await fetch(`${API_URL}/certificates/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        if (data.success) {
            loadCerts();
        } else {
            alert('Error deleting certificate: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error("Delete Certificate Error:", err);
        alert('Network error while deleting certificate.');
    }
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
