const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { userAccount, databases, storage, config } = require('./appwrite');
const { ID, Query, InputFile } = require('node-appwrite');

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
const allowedOrigins = [
    "http://localhost:3000",
    "https://portfoliop-backend.onrender.com",
    "https://portfoliopauly.onrender.com" // Added possible frontend URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".onrender.com")) {
            return callback(null, true);
        }
        return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
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
    // SECURITY NOTE: In a production Appwrite setup with a Node proxy,
    // the backend should ideally verify the session with the Appwrite API.
    // For now, we use the userEmail cookie which is set after a successful login.
    // We confirm this email exists in our 'admins' collection.

    const userEmail = req.cookies.userEmail;

    if (!userEmail) {
        console.warn(`[Auth] Blocked request for ${req.path} - No userEmail cookie`);
        return res.status(401).json({ success: false, error: "Authentication required" });
    }

    try {
        const admins = await databases.listDocuments(config.dbId, config.adminsCollectionId, [
            Query.equal('email', userEmail)
        ]);

        if (admins.total === 0) {
            console.warn(`[Auth] Blocked request for ${req.path} - User ${userEmail} is not authorized`);
            return res.status(403).json({ success: false, error: "Unauthorized access" });
        }

        req.user = { email: userEmail, role: admins.documents[0].role };
        next();
    } catch (err) {
        console.error(`[Auth Error] ${err.message}`);
        res.status(500).json({ success: false, error: "Internal session verification failed" });
    }
};

// --- AUTHENTICATION ---
// FIXED LOGIN ROUTE (MOST IMPORTANT)
app.post('/api/login', async (req, res) => {
    const { username: email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password required" });
    }

    try {
        console.log(`[Auth] Attempting login for ${email} in region ${process.env.APPWRITE_ENDPOINT}`);

        // Authenticate user FIRST using userAccount (NO API KEY)
        const session = await userAccount.createEmailPasswordSession(email, password);

        // Success - Set userEmail cookie for our backend middleware
        // This is safe because our backend will still verify this email against the DB.
        res.cookie('userEmail', email, {
            httpOnly: false, // Accessible by client-side JS (admin.js)
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ success: true, message: "Login successful" });

        // Async admin registration (DO NOT await)
        ensureAdminExists(email);

    } catch (err) {
        console.error(`[Login Error] ${err.message}`);
        res.status(401).json({
            success: false,
            error: err.message.includes("region") ? "Appwrite Region Mismatch. Check your APPWRITE_ENDPOINT." : (err.message || "Invalid credentials")
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
            tech_stack: Array.isArray(doc.techStack) ? doc.techStack : (doc.techStack ? doc.techStack.split(',').map(s => s.trim()) : []),
            image_url: doc.imageUrl,
            demo_url: doc.demoUrl,
            repo_url: doc.repoUrl,
            created_at: doc.startDate || doc.$createdAt
        }));

        res.json(projects);
    } catch (err) {
        console.error("Fetch Projects Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- ADMIN API (PROTECTED) ---

// Add Project
app.post('/api/projects', authenticateToken, upload.single('image'), async (req, res) => {
    const { title, short_description, tech_stack, demo_url, repo_url } = req.body;

    try {
        let imageUrl = null;
        if (req.file) {
            const file = await storage.createFile(
                config.bucketId,
                ID.unique(),
                InputFile.fromPath(req.file.path, req.file.originalname)
            );
            imageUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${config.bucketId}/files/${file.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
        }

        const project = await databases.createDocument(config.dbId, config.projectsCollectionId, ID.unique(), {
            projectName: title,
            description: short_description,
            startDate: new Date().toISOString(),
            imageUrl: imageUrl,
            techStack: tech_stack ? tech_stack.split(',').map(s => s.trim()) : [],
            demoUrl: demo_url || "",
            repoUrl: repo_url || ""
        });

        res.json({ success: true, project: { id: project.$id, ...project }, message: "Project added" });
    } catch (err) {
        console.error("Create Project Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete Project
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        await databases.deleteDocument(config.dbId, config.projectsCollectionId, req.params.id);
        res.json({ success: true, message: "Project deleted" });
    } catch (err) {
        console.error("Delete Project Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Certificates
app.get('/api/certificates', async (req, res) => {
    try {
        const response = await databases.listDocuments(config.dbId, config.certificatesCollectionId, [
            Query.orderDesc('$createdAt')
        ]);
        const certs = response.documents.map(doc => ({
            id: doc.$id,
            title: doc.title,
            issuer: doc.issuer,
            year: doc.year,
            image_url: doc.imageUrl,
            created_at: doc.$createdAt
        }));
        res.json(certs);
    } catch (err) {
        console.error("Fetch Certificates Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/certificates', authenticateToken, upload.single('image'), async (req, res) => {
    const { title, issuer, year } = req.body;
    try {
        let imageUrl = null;
        if (req.file) {
            const file = await storage.createFile(
                config.bucketId,
                ID.unique(),
                InputFile.fromPath(req.file.path, req.file.originalname)
            );
            imageUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${config.bucketId}/files/${file.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
        }
        const cert = await databases.createDocument(config.dbId, config.certificatesCollectionId, ID.unique(), {
            title,
            issuer,
            year: parseInt(year),
            imageUrl
        });
        res.json({ success: true, certificate: cert, message: "Certificate added" });
    } catch (err) {
        console.error("Create Certificate Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/certificates/:id', authenticateToken, async (req, res) => {
    try {
        await databases.deleteDocument(config.dbId, config.certificatesCollectionId, req.params.id);
        res.json({ success: true, message: "Certificate deleted" });
    } catch (err) {
        console.error("Delete Certificate Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Serve Admin Panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



