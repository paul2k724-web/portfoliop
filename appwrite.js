const { Client, Databases, Storage, Account } = require('node-appwrite');
require('dotenv').config();

const createUserClient = () => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID);
    return new Account(client);
};

const createAdminClient = () => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    return {
        databases: new Databases(client),
        storage: new Storage(client)
    };
};

module.exports = {
    createUserClient,
    createAdminClient,
    config: {
        dbId: process.env.APPWRITE_DB_ID || 'portfoliop-db',
        projectsCollectionId: process.env.APPWRITE_PROJECTS_COLLECTION_ID || 'projects',
        adminsCollectionId: process.env.APPWRITE_ADMINS_COLLECTION_ID || 'admins',
        bucketId: process.env.APPWRITE_BUCKET_ID || 'uploads'
    }
};

