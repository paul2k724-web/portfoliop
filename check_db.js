const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- PROJECTS ---");
    db.all("SELECT * FROM projects", (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);

        console.log("\n--- CERTIFICATES ---");
        db.all("SELECT * FROM certificates", (err, rows) => {
            if (err) console.error(err);
            else console.log(rows);
        });
    });
});
