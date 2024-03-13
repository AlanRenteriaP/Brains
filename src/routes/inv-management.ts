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
        const { productName } = req.body;
        console.log(req.body);
        if (!productName || typeof productName !== 'string') {
            return res.status(400).json({ error: 'Product name is required and must be a string.' });
        }

        // Add the product to the database
        const query = 'INSERT INTO products (product_name) VALUES ($1) RETURNING id';
        const values = [productName];
        const result: QueryResult = await pool.query(query, values);

        // Retrieve the newly inserted product ID
        const productId = result.rows[0].id;

        res.status(201).json({
            status: 'success',
            data: {
                product: {
                    id: productId,
                    name: productName
                }
            },
            message: 'Product successfully added.'
        });
    } catch (error: any) {
        console.error('Error adding product:', error);
        // Consider to not directly expose all the error details to client
        res.status(500).json({ error: 'An error occurred while adding the product. Please try again.' });
    }
});

router.get('/get_products', async (req: Request, res: Response) => {
    try {
        // Fetch products from the database
        const query = 'SELECT * FROM products';
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
        // Fetch products and their variants from the database
        const productQuery = 'SELECT * FROM products';
        const variantQuery = 'SELECT * FROM product_variants';
        const products: QueryResult = await pool.query(productQuery);
        const variants: QueryResult = await pool.query(variantQuery);

        // Process the product and variant d    ata
        const productsAndVariants = products.rows.map((product: { [key: string]: any }) => {
            // Get all variants for this product
            const productVariants = variants.rows.filter((variant: { [key: string]: any }) => variant.product_id === product.id);

            // Return the product data with its variants as subRows
            return {
                ...product,
                subRows: productVariants.map((variant: { [key: string]: any }, index: number) => {

                    return {
                        ...variant,
                        product_name: product.name,
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

router.post('/change_valid_variant/:id', async (req: Request, res: Response) => {
    try {
        const newId = parseInt(req.params.id);
        const result = await pool.query('CALL public.change_valid_variant($1)', [newId]);

        res.status(200).json({ message: 'Variant changed successfully' });
    } catch (error: any) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'An error occurred while changing the selected variant. Please try again.' });
    }
});

export default router;