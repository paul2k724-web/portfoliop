const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { createUserClient, createAdminClient, config } = require('./appwrite');
const { ID, Query } = require('node-appwrite');

const app = express();
const PORT = process.env.PORT || 3000;

const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Multer for temporary upload handling before Appwrite
const upload = multer({ dest: 'uploads/' });

// --- AUTH MIDDLEWARE ---
const authenticateToken = async (req, res, next) => {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ error: "Access denied" });

    try {
        const userEmail = req.cookies.userEmail;
        if (!userEmail) throw new Error("No user email found");

        const { databases } = createAdminClient();
        const admins = await databases.listDocuments(config.dbId, config.adminsCollectionId, [
            Query.equal('email', userEmail)
        ]);

        if (admins.total === 0) return res.status(403).json({ error: "Not an admin" });

        req.user = { email: userEmail };
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid session" });
    }
};

// --- AUTHENTICATION ---
app.post('/api/login', async (req, res) => {
    const { username: email, password } = req.body;

    try {
        // 1. Authenticate with User Client (NO API KEY)
        const account = createUserClient();
        const session = await account.createEmailPasswordSession(email, password);

        // 2. Manage Admin Record with Admin Client (WITH API KEY)
        const { databases } = createAdminClient();
        const admins = await databases.listDocuments(config.dbId, config.adminsCollectionId, [
            Query.equal('email', email)
        ]);

        if (admins.total === 0) {
            await databases.createDocument(config.dbId, config.adminsCollectionId, ID.unique(), {
                email: email,
                role: 'owner'
            });
        }

        res.cookie('sessionId', session.$id, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.cookie('userEmail', email, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.json({ success: true, message: "Login successful" });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(401).json({ error: "Invalid credentials or unauthorized" });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('sessionId');
    res.clearCookie('userEmail');
    res.json({ message: "Logged out" });
});

app.get('/api/check-auth', authenticateToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
});

// --- PUBLIC API ---

// Get All Projects
app.get('/api/projects', async (req, res) => {
    try {
        const { databases } = createAdminClient();
        const response = await databases.listDocuments(config.dbId, config.projectsCollectionId, [
            Query.orderDesc('$createdAt')
        ]);

        const projects = response.documents.map(doc => ({
            id: doc.$id,
            title: doc.projectName,
            short_description: doc.description,
            full_description: doc.description,
            tech_stack: [],
            image_url: doc.imageUrl,
            created_at: doc.startDate || doc.$createdAt
        }));

        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN API (PROTECTED) ---

// Add Project
app.post('/api/projects', authenticateToken, upload.single('image'), async (req, res) => {
    const { title, short_description } = req.body;

    try {
        const { databases, storage } = createAdminClient();
        let imageUrl = null;
        if (req.file) {
            const file = await storage.createFile(config.bucketId, ID.unique(), req.file.path);
            imageUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${config.bucketId}/files/${file.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
        }

        const project = await databases.createDocument(config.dbId, config.projectsCollectionId, ID.unique(), {
            projectName: title,
            description: short_description,
            startDate: new Date().toISOString(),
            imageUrl: imageUrl
        });

        res.json({ id: project.$id, message: "Project added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Project
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const { databases } = createAdminClient();
        await databases.deleteDocument(config.dbId, config.projectsCollectionId, req.params.id);
        res.json({ message: "Project deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Certificates
app.get('/api/certificates', (req, res) => {
    res.json([]);
});

// Serve Admin Panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


