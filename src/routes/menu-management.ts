import express, { Request, Response } from 'express';
import pool from '../database';
import dotenv from 'dotenv';
import { QueryResult } from 'pg';
dotenv.config();
const router = express.Router();

router.get('/testing', async (req: Request, res: Response) => {
    res.json({ 'itsworking':'yes' });
});



export default router;