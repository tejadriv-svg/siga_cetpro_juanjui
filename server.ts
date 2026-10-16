import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './src/middleware/auth.js';

import { academicRouter } from './src/api/academic.js';
import { padronRouter } from './src/api/padron.js';
import { matriculaRouter } from './src/api/matricula.js';
import { tesoreriaRouter } from './src/api/tesoreria.js';
import { notasRouter } from './src/api/notas.js';
import { explorerRouter } from './src/api/explorer.js';
import { importRouter } from './src/api/import.js';
import { adminRouter } from './src/api/admin.js';
import { personalRouter } from './src/api/personal.js';
import { documentosRouter } from './src/api/documentos.js';
import { egresadosRouter } from './src/api/egresados.js';
import { certificadosModularesRouter } from './src/api/certificadosModulares.js';
import { certificadosEstudiosRouter } from './src/api/certificadosEstudios.js';
import { titulosRouter } from './src/api/titulos.js';

// Handle dirname for both ESM and CJS environments
const dirName = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta?.url || 'file://' + process.cwd() + '/server.ts'));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/uploads', express.static(path.join(dirName, 'uploads')));
  app.use('/storage/v1/object/public/Documentos', express.static(path.join(dirName, 'uploads', 'Documentos')));

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
  });

  app.use('/api/academic', academicRouter);
  app.use('/api/padron', padronRouter);
  app.use('/api/matriculas', matriculaRouter);
  app.use('/api/tesoreria', tesoreriaRouter);
  app.use('/api/notas', notasRouter);
  app.use('/api/personal', personalRouter);
  app.use('/api/documentos', documentosRouter);
  app.use('/api/egresados', egresadosRouter);
  app.use('/api/certificados-modulares', certificadosModularesRouter);
  app.use('/api/certificados-estudios', certificadosEstudiosRouter);
  app.use('/api/titulos', titulosRouter);
  app.use('/api/explorer', explorerRouter);
  app.use('/api/import', importRouter);
  app.use('/api/admin', adminRouter);

  // Secure route example
  app.get('/api/user/profile', requireAuth, (req, res) => {
    // Typecast req to AuthRequest inline or just use any since we'll refactor anyway
    res.json({ message: 'Secure data accessed', user: (req as any).user });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        fs: {
          strict: false,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
