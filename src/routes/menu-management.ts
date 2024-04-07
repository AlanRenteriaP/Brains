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
                    categories: String(categories).split(', ').map(category => category.trim()), // Ensure it's a string and trim spaces
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
                    cost: active_variant_price
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


router.post('/add_menu_item', async (req, res) => {
    const client = await pool.connect();
    try {
        // Extracting data from request body
        const { name, description, materials } = req.body;

        // Preliminary validation
        if (!name || typeof name !== 'string' || !description || typeof description !== 'string' || !Array.isArray(materials)) {
            return res.status(400).json({ error: 'Invalid input data.' });
        }

        // Prepare and execute the transaction
        await client.query('BEGIN');

        const recipeInsertQuery = `
            INSERT INTO recipes (name, description)
            VALUES ($1, $2)
            RETURNING id;
        `;
        const recipeResult = await client.query(recipeInsertQuery, [name, description]);
        const recipeId = recipeResult.rows[0].id;

        const ingredientInsertQuery = `
            INSERT INTO ingredients (recipes_id, products_id, quantity)
            VALUES ($1, $2, $3);
        `;

        // Validate and insert each material
        for (const { material, quantity } of materials) {
            if (material && material.id && typeof quantity === 'number') {
                await client.query(ingredientInsertQuery, [recipeId, material.id, quantity]);
            } else {
                throw new Error('Invalid material data');
            }
        }

        await client.query('COMMIT');

        // Successful insertion response
        res.status(201).json({
            status: 'success',
            message: 'Recipe successfully added',
            data: {
                id: recipeId,
                name,
                description,
                materials,
            },
        });
    } catch (error: unknown) {
        await client.query('ROLLBACK');
        console.error('Error adding recipe:', error);

        // Using a type guard to check if `error` is an instance of Error
        if (error instanceof Error) {
            res.status(500).json({
                error: 'An error occurred while adding the recipe. Please try again.',
                details: error.message,
            });
        } else {
            // Handle the case where the error might not be an instance of Error
            res.status(500).json({
                error: 'An error occurred while adding the recipe. Please try again.',
                details: 'Unknown error',
            });
        }
    }finally {
        client.release();
    }
});

export default router;