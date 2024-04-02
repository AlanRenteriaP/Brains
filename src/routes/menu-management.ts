import express, { Request, Response } from 'express';
import pool from '../database';
import dotenv from 'dotenv';
import { QueryResult } from 'pg';
dotenv.config();
const router = express.Router();

router.get('/testing', async (req: Request, res: Response) => {
    res.json({ 'itsworking':'yes' });
});

function isErrorWithMessage(error: unknown): error is { message: string } {
    return typeof error === 'object' && error !== null && 'message' in error;
}


router.get('/menuData', async (req, res) => {
    try {
        const recipeQuery = `
            SELECT
                r.id,
                'https://fakeimg.pl/300x300/?text=Proyecto_Xocolate' AS image,
                r.name AS title,
                r.description,
                r.price AS sellingPrice,
                r.categories
            FROM
                recipes r;
        `;
        const recipesResult = await pool.query(recipeQuery);
        const recipesWithCategories = recipesResult.rows.map(recipe => {
            // Adjust based on the actual data type of `categories`
            const categories = Array.isArray(recipe.categories) ? recipe.categories.join(', ') : recipe.categories;
            return {
                ...recipe,
                category: categories // Directly use or adjust based on your needs
            };
        });

        res.status(200).json(recipesWithCategories);
    }  catch (error: unknown) {
        if (isErrorWithMessage(error)) {
            console.error('Error getting menu data:', error.message);
            res.status(500).json({ error: 'An error occurred while fetching the menu data. Please try again.', details: error.message });
        } else {
            // Handle the case where the error does not have a message
            console.error('An unexpected error occurred:', error);
            res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
        }
    }
});

export default router;