const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { userAccount, databases, storage, config } = require('./appwrite');
const { ID, Query } = require('node-appwrite');

const app = express();
const PORT = process.env.PORT || 3000;

const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// --- 1) HEALTH CHECK (REQUIRED FOR RENDER) ---
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

// --- 2) FIX CORS (CRITICAL) ---
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://portfoliop-pauly.onrender.com", // My best guess for frontend URL based on backend name
        /\.onrender\.com$/ // Allow all onrender subdomains as safety
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Multer for temporary upload handling before Appwrite
const upload = multer({ dest: 'uploads/' });

// Helper to ensure admin exists in collection
async function ensureAdminExists(email) {
    try {
        const admins = await databases.listDocuments(config.dbId, config.adminsCollectionId, [
            Query.equal('email', email)
        ]);

        if (admins.total === 0) {
            await databases.createDocument(config.dbId, config.adminsCollectionId, ID.unique(), {
                email: email,
                role: 'owner'
            });
        }
    } catch (err) {
        console.error("Admin auto-registration failed:", err.message);
    }
}

// --- AUTH MIDDLEWARE ---
const authenticateToken = async (req, res, next) => {
    // Note: Since we are not manually setting sessionId/userEmail in our refined login,
    // we assume Appwrite session cookies are used or the userEmail cookie is set by the client.
    // For now, checking userEmail cookie to restrict access.
    const userEmail = req.cookies.userEmail;
    if (!userEmail) return res.status(401).json({ error: "Access denied" });

    try {
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
// FIXED LOGIN ROUTE (MOST IMPORTANT)
app.post('/api/login', async (req, res) => {
    const { username: email, password } = req.body;

    try {
        // Authenticate user FIRST using userAccount (NO API KEY)
        const session = await userAccount.createEmailPasswordSession(email, password);

        // Success - respond immediately
        // Note: As per requirement, we do NOT manually set cookies with res.cookie().
        res.status(200).json({ success: true, message: "Login successful" });

        // Async admin registration (DO NOT await)
        ensureAdminExists(email);

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(401).json({
            error: err.message || "Invalid credentials"
        });
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



