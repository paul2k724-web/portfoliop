const { Client, Databases, Storage, Account } = require('node-appwrite');
require('dotenv').config();

// A) USER CLIENT (NO API KEY)
// Used ONLY for login (createEmailPasswordSession)
const userClient = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID);

const userAccount = new Account(userClient);

// B) ADMIN CLIENT (WITH API KEY)
// Used for databases + storage ONLY
const adminClient = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(adminClient);
const storage = new Storage(adminClient);

module.exports = {
    userAccount,
    databases,
    storage,
    config: {
        dbId: process.env.APPWRITE_DB_ID || 'portfoliop-db',
        projectsCollectionId: process.env.APPWRITE_PROJECTS_COLLECTION_ID || 'projects',
        adminsCollectionId: process.env.APPWRITE_ADMINS_COLLECTION_ID || 'admins',
        bucketId: process.env.APPWRITE_BUCKET_ID || 'uploads'
    }
};
