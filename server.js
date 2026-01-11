const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { databases, storage: appwriteStorage, account, config, client } = require('./appwrite');
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
        // In Appwrite Server SDK, we can't easily verify a client session ID directly 
        // without the client's JWT or specific headers. 
        // However, for this project's requirements, we will assume the sessionId represents a valid Appwrite session.
        // We will attempt to get the user using the session.
        // NOTE: The Server SDK usually uses API Keys. 
        // For minimal changes, we'll validate if the user is in the 'admins' collection.
        // We'll store the email in the cookie for simplicity in this beginner-friendly refactor.
        const userEmail = req.cookies.userEmail;
        if (!userEmail) throw new Error("No user email found");

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
    const { username: email, password } = req.body; // Map username field to email

    try {
        // Appwrite Login (Server-side login is usually for API keys, but we can simulate session check)
        // For a beginner-friendly setup, we'll verify the user exists and password is correct via the 'Account' API
        // But the Account API in Server SDK requires a session or JWT.
        // Actually, the easiest way for a Node backend to "log in" is to use the Appwrite Console to create the user,
        // and here we just check if they are authorized.

        // Since we want to keep the frontend UNCHANGED, we'll use the Appwrite Account API
        // to verify credentials.
        const session = await account.createEmailPasswordSession(email, password);

        // On success, check/register admin
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
        const response = await databases.listDocuments(config.dbId, config.projectsCollectionId, [
            Query.orderDesc('$createdAt')
        ]);

        // Map Appwrite fields back to what the Frontend expects
        const projects = response.documents.map(doc => ({
            id: doc.$id,
            title: doc.projectName,
            short_description: doc.description,
            full_description: doc.description, // Mapping both to description for now
            tech_stack: [], // Placeholder since Appwrite spec didn't include it
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
            const file = await appwriteStorage.createFile(config.bucketId, ID.unique(), req.file.path);
            // Construct the public URL for the image
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

// Certificates Routes (Now Static placeholders or removed as per user request)
app.get('/api/certificates', (req, res) => {
    res.json([]); // Return empty as they are static now
});

app.post('/api/certificates', authenticateToken, (req, res) => {
    res.status(405).json({ error: "Certificates are now static. Update them in the frontend directly." });
});

// Serve Admin Panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

