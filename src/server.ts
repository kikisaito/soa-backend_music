import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import https from 'https'; // <-- CAMBIO 1: Importamos el módulo https de Node

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

// CAMBIO 1: Creamos el agente para evadir el bloqueo del certificado en redes locales estrictas
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, 
});

app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST']
}));
app.use(express.json());




app.get('/api/music/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string) || 1;
        const limitPerPage = 12; 
        
        if (!query) {
            return res.status(400).json({ error: 'Falta el parámetro de búsqueda (q)' });
        }

        // Pedimos 60 resultados a iTunes (para tener unas 5 páginas de datos)
        const itunesResponse = await axios.get(`https://itunes.apple.com/search?term=${query}&entity=song&limit=60`, {
            httpsAgent
        });
        
        const allResults = itunesResponse.data.results || [];
        
        // Aplicamos la paginación en nuestra propia capa de servicios
        const startIndex = (page - 1) * limitPerPage;
        const paginatedResults = allResults.slice(startIndex, startIndex + limitPerPage);
        
        res.json(paginatedResults);
        
    } catch (error) {
        console.error("Error mediando con iTunes:", error);
        res.status(500).json({ error: "Fallo de comunicación con el servicio de música" });
    }
});




//Next.js pueda consultar la base de datos
app.get('/api/music/favorites', async (req: Request, res: Response) => {
    try {
        const favorites = await prisma.favoriteTrack.findMany({
            orderBy: { createdAt: 'desc' } // Las más recientes primero
        });
        res.json(favorites);
    } catch (error) {
        console.error("Error obteniendo favoritos:", error);
        res.status(500).json({ error: 'No se pudieron obtener las canciones favoritas' });
    }
});






// 3. ENDPOINT DE BASE DE DATOS (Persistencia Propia con Prisma)
app.post('/api/music/favorites', async (req: Request, res: Response) => {
    try {
        // CAMBIO 3: Cambiamos deezerId por trackId (iTunes)
        const { trackId, title, artist, albumCover } = req.body;

        const newFavorite = await prisma.favoriteTrack.create({
            data: {
                trackId: String(trackId),
                title,
                artist,
                albumCover
            }
        });

        res.status(201).json(newFavorite);
    } catch (error) {
        console.error("Error guardando favorito:", error);
        res.status(500).json({ error: 'No se pudo guardar la canción favorita en la base de datos' });
    }
});

app.listen(port, () => {
    console.log(`Servidor Backend Proxy corriendo de forma segura en http://localhost:${port}`);
});