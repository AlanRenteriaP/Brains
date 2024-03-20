// src/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import invManagementRoutes from './inv-management';
import menuBuild from './menuBuild';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/invmanagement', invManagementRoutes);
router.use('/menuBuild', menuBuild);



export default router;