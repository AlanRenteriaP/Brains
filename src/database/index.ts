// src/database/index.ts
import { Pool } from 'pg';

import dotenv from 'dotenv';
dotenv.config();

console.log('Connecting to database...');

const pool = new Pool({
    host: 'beatrenger.cddfuclqgm0i.us-west-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'TomBradyandNickFolesKissing213!',
});


export default pool;