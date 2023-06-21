// src/database/index.ts
import { Pool } from 'pg';

import dotenv from 'dotenv';
dotenv.config();

console.log('Connecting to database...');


const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});


export default pool;