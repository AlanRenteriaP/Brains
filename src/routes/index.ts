// src/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import invManagementRoutes from './inv-management';

import menuManagementRoutes from './menu-management';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/invmanagement', invManagementRoutes);

router.use('/menumanagement', menuManagementRoutes);

export default router;