import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/validate', authenticateToken, (req, res) => {
  // If we reach here, the token is valid (authenticateToken middleware passed)
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);

export default router;