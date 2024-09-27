import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const config_schema = z.object({
    port: z.string(),
    omdb_api_key: z.string(),
    db: z.object({
        url: z.string(),
        name: z.string(),
        collection_name: z.string(),
    }),
});
export default config_schema.parse({
    port: process.env.PORT,
    omdb_api_key: process.env.OMDB_API_KEY,
    db: {
        url: process.env.MONGODB_URI,
        name: process.env.MONGODB_DB_NAME,
        collection_name: process.env.MONGODB_COLLECTION_NAME,
    },
});
