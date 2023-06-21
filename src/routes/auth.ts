// src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database';
import dotenv from 'dotenv';
import { Secret } from 'jsonwebtoken';
dotenv.config();
const router = express.Router();


// Registration route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Hash the password
        console.log(req.body);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Store user in the database
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashedPassword]
        );
        const secretKey = process.env.DB_PASSWORD;
        console.log(newUser.rows[0]);
        // Generate JWT
        let token: string;

        if (secretKey) {
            token = jwt.sign({ id: newUser.rows[0].id }, secretKey);
        } else {
            token = jwt.sign({ id: newUser.rows[0].id }, null, { algorithm: 'none' });
        }
        res.json({ token });
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'message' in err) {
            console.error((err as { message: string }).message);
        }
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('logging bitches');
        const { name, email, password } = req.body;
        console.log(req.body);
        console.log('logging bitches and the email is ' + email + ' and password is ' + password);
        // Check if user exists
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            console.log('Invalid Credential wrong email I think:'+user.rows.length+" this is the emial:"+email);
            return res.status(401).json('Invalid Credential wrong email I think:'+user.rows.length+" this is the emial:"+email);
        }

        // Check if password is correct
        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            console.log('Invalid Credential wrong password I think:'+validPassword);
            return res.status(401).json('Invalid Credential wrong password I think:'+validPassword);
        }

        const secretKey = process.env.JWT_SECRET;

        // Generate JWT
        const token = jwt.sign({ id: user.rows[0].id,admin:true }, secretKey as Secret);

        res.json({ token });
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'message' in err) {
            console.error((err as { message: string }).message);
        }
        res.status(500).send('Server error');
    }
});

export default router;
