import { MongoClient, Db } from 'mongodb'
import config from './config.js';

let db: Db | null = null;

const connectToDb = async () => {
    if (db) {
        return db;
    }

    try {
        const client = new MongoClient(config.db.url);

        await client.connect();

        db = client.db(config.db.name);

        // Defer (clean up) the connection when the process is terminated.
        process.on('SIGINT', async () => {
            await client.close();
            process.exit(0);
        });

        return db;
    } catch (err) {
        const e = new Error('Failed to connect to the database');
        console.error(e.message, err);
        throw e;
    }
};

export default connectToDb;
