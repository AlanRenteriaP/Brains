// src/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import invManagementRoutes from './inv-management';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/invmanagement', invManagementRoutes);
export default router;