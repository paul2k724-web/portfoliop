const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-this';

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for simplicity with external images/CDNs
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admin WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (result) {
                // Generate Token
                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
                // Set HTTP-only cookie
                res.cookie('token', token, { httpOnly: true, strict: true, maxAge: 3600000 });
                res.json({ success: true, message: "Login successful" });
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out" });
});

app.get('/api/check-auth', authenticateToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
});

// --- PUBLIC API ---

// Get All Projects
app.get('/api/projects', (req, res) => {
    db.all("SELECT * FROM projects ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const projects = rows.map(p => ({
            ...p,
            tech_stack: p.tech_stack ? JSON.parse(p.tech_stack) : []
        }));
        res.json(projects);
    });
});

// Get All Certificates
app.get('/api/certificates', (req, res) => {
    db.all("SELECT * FROM certificates ORDER BY created_at ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- ADMIN API (PROTECTED) ---

// Add Project
app.post('/api/projects', authenticateToken, upload.single('image'), (req, res) => {
    const { title, short_description, full_description, tech_stack, demo_url, repo_url } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `INSERT INTO projects (title, short_description, full_description, tech_stack, image_url, demo_url, repo_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [title, short_description, full_description, tech_stack, image_url, demo_url, repo_url];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Project added" });
    });
});

// Update Project
app.put('/api/projects/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { title, short_description, full_description, tech_stack, demo_url, repo_url } = req.body;
    let image_url = req.body.existing_image;
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    const sql = `UPDATE projects SET title=?, short_description=?, full_description=?, tech_stack=?, image_url=?, demo_url=?, repo_url=? WHERE id=?`;
    const params = [title, short_description, full_description, tech_stack, image_url, demo_url, repo_url, req.params.id];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Project updated" });
    });
});

// Delete Project
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM projects WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Project deleted" });
    });
});

// Add Certificate
app.post('/api/certificates', authenticateToken, (req, res) => {
    const { title, issuer, issue_date, credential_url, status, progress_percent } = req.body;
    const sql = `INSERT INTO certificates (title, issuer, issue_date, credential_url, status, progress_percent) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [title, issuer, issue_date, credential_url, status, progress_percent || 100];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Certificate added" });
    });
});

// Delete Certificate
app.delete('/api/certificates/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM certificates WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Certificate deleted" });
    });
});


// Serve Admin Panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
