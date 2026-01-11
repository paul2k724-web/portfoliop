const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'portfolio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // Projects Table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            short_description TEXT,
            full_description TEXT,
            tech_stack TEXT, -- JSON string of tags
            image_url TEXT,
            demo_url TEXT,
            repo_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Certificates Table
        db.run(`CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            issuer TEXT,
            issue_date TEXT,
            credential_url TEXT,
            image_url TEXT,
            status TEXT CHECK(status IN ('In Progress', 'Upcoming', 'Planned', 'Completed')) DEFAULT 'Completed',
            progress_percent INTEGER DEFAULT 100,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Admin User Table
        db.run(`CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )`, (err) => {
            if (!err) {
                // Create default admin if not exists
                createDefaultAdmin();
            }
        });
    });
}

function createDefaultAdmin() {
    const defaultUser = 'admin';
    const defaultPass = 'admin123'; // User should change this!

    db.get("SELECT * FROM admin WHERE username = ?", [defaultUser], (err, row) => {
        if (!row) {
            bcrypt.hash(defaultPass, 10, (err, hash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                    return;
                }
                db.run("INSERT INTO admin (username, password_hash) VALUES (?, ?)", [defaultUser, hash], (err) => {
                    if (err) console.error("Error creating default admin:", err.message);
                    else console.log("Default admin account created.");
                });
            });
        }
    });
}

module.exports = db;
