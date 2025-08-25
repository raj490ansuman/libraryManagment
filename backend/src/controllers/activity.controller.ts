import { Response } from 'express';
import { getRecentActivities, getUserActivities } from '../services/activity.service';
import { AuthRequest } from '../middlewares/auth';

export const getRecentActivitiesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await getRecentActivities(20); // Get last 20 activities
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
};

export const getUserActivitiesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const activities = await getUserActivities(userId, 20); // Get user's last 20 activities
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ message: 'Failed to fetch user activities' });
  }
};
