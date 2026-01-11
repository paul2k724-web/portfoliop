const { Client, Databases, Storage, Account } = require('node-appwrite');
require('dotenv').config();

// A) USER CLIENT (NO API KEY)
// Used ONLY for login (createEmailPasswordSession)
// B) ADMIN CLIENT (WITH API KEY)
// Used for databases + storage ONLY
let endpoint = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
if (endpoint.includes('cloud.appwrite.io') && !endpoint.includes('nyc.')) {
    endpoint = 'https://nyc.cloud.appwrite.io/v1';
}
console.log(`[Appwrite] Final endpoint: ${endpoint}`);

const adminClient = new Client()
    .setEndpoint(endpoint)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const userClient = new Client()
    .setEndpoint(endpoint)
    .setProject(process.env.APPWRITE_PROJECT_ID);

const userAccount = new Account(userClient);

const databases = new Databases(adminClient);
const storage = new Storage(adminClient);

module.exports = {
    userAccount,
    databases,
    storage,
    config: {
        dbId: process.env.APPWRITE_DB_ID || 'portfoliop-db',
        projectsCollectionId: process.env.APPWRITE_PROJECTS_COLLECTION_ID || 'projects',
        certificatesCollectionId: process.env.APPWRITE_CERTIFICATES_COLLECTION_ID || 'certificates',
        adminsCollectionId: process.env.APPWRITE_ADMINS_COLLECTION_ID || 'admins',
        bucketId: process.env.APPWRITE_BUCKET_ID || 'uploads'
    }
};
