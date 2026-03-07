import { Router } from 'express';
import { searchMusic, getFavorites, saveFavorite } from '../controllers/music.controller';

const router = Router();

// Todas estas rutas ya asumen el prefijo '/api/music' que configuraremos en server.ts
router.get('/search', searchMusic);
router.get('/favorites', getFavorites);
router.post('/favorites', saveFavorite);

export default router;