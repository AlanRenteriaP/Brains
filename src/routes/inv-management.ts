import express, { Request, Response } from 'express';
import pool from '../database';
import dotenv from 'dotenv';
import { QueryResult } from 'pg';
dotenv.config();
const router = express.Router();

router.get('/testing', async (req: Request, res: Response) => {
    res.json({ 'itsworking':'yes' });
});

router.post('/add_product', async (req: Request, res: Response) => {
    try {
        // Validate the request body
        const { productName, unitOfMeasurement } = req.body;
        console.log(req.body);
        if (!productName || typeof productName !== 'string') {
            return res.status(400).json({ error: 'Product name is required and must be a string.' });
        }
        if (!unitOfMeasurement || typeof unitOfMeasurement !== 'number') { // Assuming measurement_id is a number
            return res.status(400).json({ error: 'Unit of measurement is required and must be a number.' });
        }

        // Add the product to the database
        const query = 'INSERT INTO products (product_name, measurement_id) VALUES ($1, $2) RETURNING id';

        const values = [productName, unitOfMeasurement];
        const result: QueryResult = await pool.query(query, values);

        // Retrieve the newly inserted product ID
        const productId = result.rows[0].id;

        res.status(201).json({
            status: 'success',
            data: {
                product: {
                    id: productId,
                    name: productName,
                    measurement_id: unitOfMeasurement
                }
            },
            message: 'Product successfully added.'
        });
    } catch (error: any) {
        console.error('Error adding product:', error);
        // Consider not directly exposing all the error details to the client
        res.status(500).json({ error: 'An error occurred while adding the product. Please try again.' });
    }
});

router.get('/get_products', async (req: Request, res: Response) => {
    try {
        // Fetch products and their measurement abbreviation from the database
        const query = `
            SELECT products.*, measurement.abbreviation 
            FROM products 
            JOIN measurement ON products.measurement_id = measurement.id;
        `;
        const result: QueryResult = await pool.query(query);

        // Send the product data as JSON
        res.status(200).json(result.rows);
    } catch (error: any) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'An error occurred while fetching the products. Please try again.' });
    }
});

router.post('/add_product_variant', async (req: Request, res: Response) => {
    try {
        // Extract data from the request body
        const { productId, presentation, quantity, vendors, unit, price } = req.body;
        let vendor: string = vendors[0];
        console.log(productId, vendor ,presentation, quantity, unit, price, 'Bought' );
        // Validate data
        if (!productId || typeof productId !== 'number') {
            return res.status(400).json({ error: 'Product ID is required and must be a number.' });
        }
        // Add more validation for other fields here...

        // Call the stored procedure to add the product variant
        const query = 'CALL insert_product_variant($1, $2, $3, $4, $5, $6, $7)';
        const values = [productId, vendor ,presentation, quantity, unit, price, 'Bought' ];
        await pool.query(query, values);

        // As stored procedures might not return a value directly, you might want to fetch the newly inserted data here...

        res.status(201).json({
            status: 'success',
            data: {
                productVariant: {
                    product_id: productId,
                    presentation: presentation,
                    quantity: quantity,
                    vendors: vendors,
                    unit: unit,
                    price: price
                }
            },
            message: 'Product variant successfully added.'
        });
    } catch (error: any) {
        console.error('Error adding product variant:', error);
        // Consider not directly exposing all the error details to the client
        res.status(500).json({ error: 'An error occurred while adding the product variant. Please try again.' });
    }
});


router.get('/get_product_variants', async (req: Request, res: Response) => {
    try {
        // Fetch product variants from the database
        const query = 'SELECT * FROM product_variants';
        const result: QueryResult = await pool.query(query);

        // Send the product variants data as JSON
        res.status(200).json(result.rows);
    } catch (error: any) {
        console.error('Error getting product variants:', error);
        res.status(500).json({ error: 'An error occurred while fetching the product variants. Please try again.' });
    }
});


router.get('/get_products_and_variants', async (req: Request, res: Response) => {
    try {
        // Modify the productQuery to join with the measurement table
        const productQuery = `
            SELECT products.*, measurement.name AS measurement_name
            FROM products
            LEFT JOIN measurement ON products.measurement_id = measurement.id
        `;

        const variantQuery = 'SELECT * FROM product_variants';
        const products: QueryResult = await pool.query(productQuery);
        const variants: QueryResult = await pool.query(variantQuery);

        // Process the product and variant data
        const productsAndVariants = products.rows.map((product: { [key: string]: any }) => {
            // Get all variants for this product
            const productVariants = variants.rows.filter((variant: { [key: string]: any }) => variant.product_id === product.id);

            // Return the product data with its variants as subRows
            return {
                ...product,
                subRows: productVariants.map((variant: { [key: string]: any }) => {
                    return {
                        ...variant,
                        product_name: product.product_name,  // Adjusted from product.name
                        vendor: variant.store, // Transform store to vendor for the front-end
                    };
                }),
            };
        });

        // Send the product data with variants as JSON
        res.status(200).json(productsAndVariants);
    } catch (error: any) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'An error occurred while fetching the products. Please try again.' });
    }
});

router.post('/update_product_area', async (req: Request, res: Response) => {
    console.log('we made it here');
    try {
        const { productId, area, checkboxState } = req.body;
        if (checkboxState) {
            // Adding the product to an area
            const query = 'INSERT INTO inventory (products_id, area) VALUES ($1, $2)';
            await pool.query(query, [productId, area]);
            res.status(200).json({ message: "Product added to the area successfully!" });
        } else {
            // Removing the product from an area
            const query = 'DELETE FROM inventory WHERE products_id = $1 AND area = $2';
            await pool.query(query, [productId, area]);
            res.status(200).json({ message: "Product removed from the area successfully!" });
        }
    } catch (error: any) {
        console.error('Error updating product area:', error);
        res.status(500).json({ error: 'An error occurred while updating the product area. Please try again.' });
    }
});

router.get('/get_products_by_area', async (req: Request, res: Response) => {
    try {
        // Get the area from the request query parameters
        const area = req.query.area;

        // Query to fetch products with their inventory status for the specific area
        const productQuery = `SELECT p.*, i.min, i.max, CASE WHEN i.products_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_inventory 
        FROM products p 
        LEFT JOIN inventory i ON p.id = i.products_id AND i.area = $1`;
        const products: QueryResult = await pool.query(productQuery, [area]);

        // Send the product data as JSON
        res.status(200).json(products.rows);
    } catch (error: any) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'An error occurred while fetching the products. Please try again.' });
    }
});




export default router;