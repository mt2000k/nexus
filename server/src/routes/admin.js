import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';


export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user || (!user.isAdmin && user.username !== 'admin')) { 
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authorization error' });
  }
};

const router = Router();


router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (userId === req.user.id) {
       return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }
    
    
    const success = await db.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    
    const io = req.app.get('io');
    const userManager = req.app.get('userManager');
    
    if (io && userManager) {
      
      const allSockets = userManager.getAllUsers();
      const userSocketInfo = allSockets.find(u => u.dbId === userId || u.id === userId);
      if (userSocketInfo) {
        io.sockets.sockets.get(userSocketInfo.id)?.disconnect(true);
      }
      io.emit('user_deleted', { id: userId });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
