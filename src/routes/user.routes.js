import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { getPublicProfile, updateProfile, uploadAvatar } from '../controllers/user.controller.js';

const router = Router();

router.get('/:id', getPublicProfile);
router.put('/:id', authenticate, updateProfile);
router.patch('/:id/avatar', authenticate, upload.single('avatar'), uploadAvatar);

export default router;
