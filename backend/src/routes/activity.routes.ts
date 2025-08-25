import { Router } from 'express';
import { getRecentActivitiesHandler, getUserActivitiesHandler } from '../controllers/activity.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Public route - anyone can see recent activities
router.get('/', getRecentActivitiesHandler);

// Protected route - get activities for the authenticated user
router.get('/me', authMiddleware, getUserActivitiesHandler);

export default router;
