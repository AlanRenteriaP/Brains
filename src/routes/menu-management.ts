import express, { Request, Response } from 'express';
import pool from '../database';
import dotenv from 'dotenv';
import { QueryResult } from 'pg';
dotenv.config();
const router = express.Router();

router.get('/testing', async (req: Request, res: Response) => {
    res.json({ 'itsworking':'yes' });
});



// router.post('/add_recipe_and_ingredients', async (req: Request, res: Response) => {
//     try {
//         // Extract data from the request body
//         const { option, name, description, price, categories, productId, quantity } = req.body;
//
//         // Call the stored procedure
//         const query = 'CALL insert_recipe_and_ingredients($1, $2, $3, $4, $5, $6, $7)';
//         const values = [option, name, description, price, categories, productId, quantity];
//         await pool.query(query, values);
//
//         res.status(200).send({msg: "Operation successful"});
//     } catch (error: any) {
//         console.error('Error:', error.message);
//         res.status(500).json({ error: 'An error occurred. Please try again.' });
//     }
// });

router.post('/add_recipe', async (req, res) => {
    try {
        const {name, description, price, categories} = req.body;
        const query = 'SELECT add_recipe($1, $2, $3, $4)';
        const values = [name, description, price, categories];

        const result = await pool.query(query, values);
        const recipeId = result.rows[0].add_recipe;

        res.status(200).send({ msg: 'Recipe added successfully', recipeId: recipeId });
    } catch (error:any) {
        console.error('Error:', error.message);
        res.status(500).send({ error: 'An error occurred. Please try again.' });
    }
});


router.post('/add_ingredient', async (req, res) => {
    try {
        const {recipeId, productId, quantity} = req.body;
        const query = 'SELECT add_ingredient($1, $2, $3)';
        const values = [recipeId, productId, quantity];

        await pool.query(query, values);
        res.status(200).send({ msg: 'Ingredient added successfully.' });
    } catch (error:any) {
        console.error('Error:', error.message);
        res.status(500).send({ error: 'An error occurred. Please try again.' });
    }
});

export default router;