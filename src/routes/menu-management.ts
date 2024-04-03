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
        const recipeWithMaterialsQuery = `
            SELECT
                r.id AS recipe_id,
                r.name AS title,
                r.description,
                 COALESCE(r.price, 0) AS sellingprice,  
                r.categories,
                'https://fakeimg.pl/300x300/?text=Proyecto_Xocolate' AS image,
                i.products_id,
                p.product_name AS material_name,
                i.quantity,
                m.name AS measurement,
                pv.price AS active_variant_price
            FROM
                recipes r
                LEFT JOIN ingredients i ON r.id = i.recipes_id
                LEFT JOIN products p ON i.products_id = p.id
                LEFT JOIN measurement m ON p.measurement_id = m.id
                LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true;
        `;
        const result = await pool.query(recipeWithMaterialsQuery);
        console.log(result.rows[0]);
        const recipes = result.rows.reduce((acc, curr) => {
            const {
                recipe_id,
                title,
                description,
                sellingprice,
                categories,
                image,
                products_id,
                material_name,
                quantity,
                measurement,
                active_variant_price
            } = curr;
            if (!acc[recipe_id]) {
                acc[recipe_id] = {
                    id: recipe_id,
                    title,
                    description,
                    sellingPrice: sellingprice,
                    categories: categories ? categories.join(', ') : 'No category',
                    image,
                    materials: []
                };
            }
            if (products_id && material_name && quantity !== null) {
                acc[recipe_id].materials.push({
                    products_id,
                    name: material_name,
                    quantity,
                    measurement,
                    cost: active_variant_price // Assuming 'cost' represents the price of the active variant
                });
            }
            return acc;
        }, {});

        const recipesArray = Object.values(recipes);
        res.status(200).json(recipesArray);
    } catch (error: unknown) {
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