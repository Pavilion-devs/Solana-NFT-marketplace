import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';
import { config, validateEnv } from './config/env';

// Import routes
import collectionsRoutes from './routes/collections';
import walletRoutes from './routes/wallet';
import nftRoutes from './routes/nft';

// Check if required environment variables are set
if (!validateEnv()) {
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API routes
app.use('/collections', collectionsRoutes);
app.use('/wallet', walletRoutes);
app.use('/nft', nftRoutes);
// Try to load Swagger documentation if available
try {
  const openapiPath = path.resolve(__dirname, '../src/docs/openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const swaggerDocument = YAML.load(openapiPath);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log('Swagger documentation loaded successfully');
  } else {
    console.warn('OpenAPI specification file not found at:', openapiPath);
    app.use('/docs', (req, res) => {
      res.status(404).send('API documentation not available');
    });
  }
} catch (error) {
  console.error('Failed to load Swagger documentation:', error);
}

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'Solana NFT MCP Server',
    documentation: '/docs',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`API documentation available at http://localhost:${config.port}/docs`);
  
  // Display API key status
  console.log(`Helius API Key: ${config.heliusApiKey ? 'Configured' : 'Missing'}`);
  console.log(`Magic Eden API Key: ${config.magicEdenApiKey ? 'Configured (needed only for listing/delisting)' : 'Not configured (only needed for listing/delisting)'}`);
}); 