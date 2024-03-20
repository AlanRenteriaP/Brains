import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, {JwtPayload} from 'jsonwebtoken';
import pool from '../database';
import dotenv from 'dotenv';
import { QueryResult } from 'pg';
import { Secret } from 'jsonwebtoken';
dotenv.config();
const router = express.Router();
const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

const generateToken = (id: number, roles: string[], secretKey: Secret | undefined): string => {
    if (secretKey) {
        return jwt.sign({ id, roles }, secretKey);
    }
    return jwt.sign({ id, roles }, null, { algorithm: 'none' });
};


router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!(name && email && password)) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser: QueryResult = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashedPassword]
        );
        const token = generateToken(newUser.rows[0].id, [], process.env.JWT_SECRET);
        res.status(201).json({ token });
    } catch (error: any) {
        console.error('Error during registration:', error.message);
        res.status(500).json({ error: 'Server error. Registration failed.' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!(email && password)) {
            return res.status(400).json({ error: 'Both email and password are required.' });
        }
        const user: QueryResult = await pool.query(
            `SELECT users.*, array_agg(roles.role_name) as roles
             FROM users
             LEFT JOIN user_roles ON users.id = user_roles.user_id
             LEFT JOIN roles ON user_roles.role_id = roles.id
             WHERE users.email = $1
             GROUP BY users.id`,
            [email]
        );
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = generateToken(user.rows[0].id, user.rows[0].roles, 'asdlkjfhaslkd12983470fjlkawelfkjawalanrenterialkejfoiasdfljkhwelkja1029384welkfjjasdflkjwelkejf');
        res.json({ token });
    } catch (error: any) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Server error. Login failed.' });
    }
});

router.post('/change-password', async (req: Request, res: Response) => {
    try {
        const {token, newpassword} = req.body;
        const payload = jwt.decode(token) as JwtPayload;
        console.log(payload);
        console.log(payload.id);

        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(newpassword, salt);

        const sameUser: QueryResult = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
            [hashedPassword, payload.id]
        );

        const newtoken = generateToken(sameUser.rows[0].id, [], process.env.JWT_SECRET);
        console.log(newtoken);
        res.status(201).json({newtoken});
    } catch (error: any) {
        console.error('Error during change:', error.message);
        res.status(500).json({error: 'Server error. Password change failed.'});
    }

});

// router.get('/decodetoken', async (req: Request, res: Response) => {
//     const { token } = req.body;
//    const payload = jwt.decode(token);
//     res.status(200).json({ message: payload });
// });



export default router;
