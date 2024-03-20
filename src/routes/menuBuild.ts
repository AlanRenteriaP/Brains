import express, { Request, Response } from 'express';
import pool from '../database';
import dotenv from 'dotenv';
import { QueryResult } from 'pg';
dotenv.config();
const router = express.Router();


router.get('/testing', async (req: Request, res: Response) => {
    res.json({ 'itsworking':'yes' });
});


router.post('/testing', async (req: Request, res: Response) => {

    const data = req.body;

    // You can now use this data as needed, for example, logging it or processing it
    console.log(data);

    res.json({ 'itsworking':'yes', receivedData: data });
});



router.post('/add_menu_item', async (req: Request, res: Response) => {
    try {
        // Extracting data from request body
        const { name, description, price, materials } = req.body;

        // Basic validation
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Recipe name is required and must be a string.' });
        }
        if (!description || typeof description !== 'string') {
            return res.status(400).json({ error: 'Description is required and must be a string.' });
        }

        if (!Array.isArray(materials)) {
            return res.status(400).json({ error: 'Materials must be an array.' });
        }

        // Insert the recipe into the recipes table
        const recipeQuery = 'INSERT INTO recipes (name, description) VALUES ($1, $2 ) RETURNING id';
        const recipeValues = [name, description];
        const recipeResult = await pool.query(recipeQuery, recipeValues);
        const recipeId = recipeResult.rows[0].id;
        // Insert each material into the ingredients table
        for (const material of materials) {
            if (!material.material.id || typeof material.quantity !== 'number') {
                continue; // Skip if products_id or quantity is missing or invalid
            }
            const ingredientQuery = 'INSERT INTO ingredients (recipes_id, products_id, quantity) VALUES ($1, $2, $3)';

            const ingredientValues = [recipeId, material.material.id, material.quantity];

            await pool.query(ingredientQuery, ingredientValues);
        }
        console.log("SQL Query:", recipeQuery);
        console.log("Values:", recipeValues);
        res.status(201).json({
            status: 'success',
            data: {
                recipe: {
                    id: recipeId,
                    name: name,
                    description: description,
                    materials: materials
                }
            },
            message: 'Recipe successfully added.'
        });
    } catch (error) {
        console.error('Error adding recipe:', error);
        res.status(500).json({ error: 'An error occurred while adding the recipe. Please try again.' });
    }
});


router.get('/catalog', async (req, res) => {
    try {
        const query = `SELECT 
    r.id,
    'https://fakeimg.pl/300x300/?text=Proyecto_Xocolate' AS image,
    r.name AS title,
    r.description,
    array_agg(jsonb_build_object('name', p.product_name, 'quantity', i.quantity, 'cost', pv.price, 'unit', pv.unit)) AS materials,
    r.categories,
    r.price AS sellingPrice
FROM 
    recipes r
JOIN 
    ingredients i ON r.id = i.recipes_id
JOIN 
    products p ON i.products_id = p.id
LEFT JOIN 
    product_variants pv ON pv.product_id = p.id AND pv.is_active = true
GROUP BY 
    r.id
ORDER BY 
    r.id;
`;

        const result = await pool.query(query);
        res.status(200).json({
            status: 'success',
            data: result.rows,
            message: 'Menu products retrieved successfully.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the menu products.' });
    }
});

export default router;