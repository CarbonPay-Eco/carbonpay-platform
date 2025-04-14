import { Router } from 'express';
import { healthCheck } from '../middlewares/helthCheck';
const router = Router();

// Import route modules
// import userRoutes from './user.routes';
// import authRoutes from './auth.routes';

// Use route modules
// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);

// Health check route
router.get('/health', healthCheck);

export default router; 