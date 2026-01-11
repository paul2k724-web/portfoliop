# Portfolio Hosting Guide

Your portfolio is now production-ready! It uses **Node.js** for the backend and **SQLite** for the database. Because SQLite stores data in a local file (`portfolio.db`) and you have image uploads (`uploads/` folder), you need a hosting provider that supports **Persistent Storage**.

> **⚠️ Important:** Standard "static" or "serverless" hosts like Vercel or Netlify **will not work** properly with this backend because they wipe the filesystem every time the app restarts (meaning you'd lose your admin login and uploaded images).

Here are the two best ways to host this:

## Option 1: Render (Easiest PaaS)
Render is great because it handles the server setup for you.

1.  **Push to GitHub**: Make sure your code is pushed to a GitHub repository.
2.  **Create Web Service**:
    *   Go to [dashboard.render.com](https://dashboard.render.com/) and create a new **Web Service**.
    *   Connect your GitHub repo.
3.  **Configure**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
4.  **Persistent Disk (Crucial)**:
    *   In the settings, add a **Disk**.
    *   Mount Path: `/opt/render/project/src` (or simply mounts for `/uploads` and the DB file if you want to be specific, but mounting the root is easiest for simple apps, though verify Render's specific paths).
    *   *Note*: Disks require a paid plan (~$7/mo). If you use the **Free Tier**, your database and images will technically work but **will disappear** if the server sleeps/restarts.
5.  **Environment Variables**:
    *   Add `JWT_SECRET` -> (Generate a random string).

## Option 2: Railway (Best for Easy Volumes)
Railway is excellent for Node + SQLite because it has a very simple system for "Volumes" (persistent folders).

1.  **Create Project**: Go to [railway.app](https://railway.app/) and create a new project from your GitHub repo.
2.  **Add a Volume**:
    *   In the service settings, go to **Volumes** and click "Add Volume".
    *   Mount it to `/app/uploads` (or the root if desired).
    *   Update your `.env` variables in Railway (`JWT_SECRET`).
3.  **Deployment**: Railway will automatically build and start your Node app.

---

## Option 3: VPS (DigitalOcean / Linode / Hetzner) - Recommended for Control
A Virtual Private Server (VPS) acts just like your local computer. It's the most robust way to host a Node+SQLite app.

1.  **Get a VPS**: Buy a small droplet (e.g., Ubuntu 22.04) on DigitalOcean (~$4/mo).
2.  **Connect**: SSH into your server.
3.  **Install Node.js**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
4.  **Clone Your Repo**:
    ```bash
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    npm install
    ```
5.  **Setup PM2 (Process Manager)**:
    *   PM2 keeps your site running forever.
    ```bash
    npm install -g pm2
    pm2 start server.js --name "portfolio"
    pm2 startup
    pm2 save
    ```
6.  **Setup Nginx (Optional but Recommended)**:
    *   Use Nginx as a reverse proxy to forward traffic from port 80 to 3000.

## What about Firebase / Vercel / Netlify?
These are "Serverless" or "Static" hosting platforms. While they are very popular, they are **not a direct fit** for this current project because:

*   **Stateless**: Firebase/Vercel functions restart frequently. Since we use **SQLite** (a local file), your database would reset every time the server restarts.
*   **Read-Only Filesystem**: These platforms do not allow you to save files to an `uploads/` folder permanently. You would have to rewrite the code to use "Firebase Storage" or "AWS S3" for images.

**Recommendation**: If you want to use Firebase, you would need to rewrite the backend to use **Firestore (Database)** and **Firebase Storage**. For the current code, **Oracle Cloud** or a **VPS** is much better because it provides a "Real Computer" where your database and images stay safe.

---

## Post-Deployment Checklist
-   [ ] **Change Default Password**: Immediately log in to `/admin` and change the default `admin` / `admin123` password (if you added a change password feature, otherwise manually update the hash in the DB or use the default one and treat it carefully).
-   [ ] **Set JWT_SECRET**: Ensure your production `.env` has a strong secret.
-   [ ] **Test Uploads**: Upload an image to verify the storage folder is writable.

## Running Locally
To run this production version on your computer:
1.  Create a `.env` file (copy `.env.example`).
2.  Run `npm start`.
3.  Go to `http://localhost:3000`.
