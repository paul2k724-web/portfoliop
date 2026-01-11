const { Client, Databases, Storage, Account } = require('node-appwrite');
require('dotenv').config();

const client = new Client();

client
    .setEndpoint(process.env.APPWRITE_ENDPOINT) // Your Appwrite Endpoint
    .setProject(process.env.APPWRITE_PROJECT_ID) // Your project ID
    .setKey(process.env.APPWRITE_API_KEY); // Your secret API key

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

module.exports = {
    client,
    databases,
    storage,
    account,
    config: {
        dbId: process.env.APPWRITE_DB_ID || 'portfoliop-db',
        projectsCollectionId: process.env.APPWRITE_PROJECTS_COLLECTION_ID || 'projects',
        adminsCollectionId: process.env.APPWRITE_ADMINS_COLLECTION_ID || 'admins',
        bucketId: process.env.APPWRITE_BUCKET_ID || 'uploads'
    }
};
