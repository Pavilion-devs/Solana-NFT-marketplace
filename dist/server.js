"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./config/env");
// Import routes
const collections_1 = __importDefault(require("./routes/collections"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const nft_1 = __importDefault(require("./routes/nft"));
// Check if required environment variables are set
if (!(0, env_1.validateEnv)()) {
    process.exit(1);
}
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
// API routes
app.use('/api/collections', collections_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/nft', nft_1.default);
// Try to load Swagger documentation if available
try {
    const openapiPath = path_1.default.resolve(__dirname, '../src/docs/openapi.yaml');
    if (fs_1.default.existsSync(openapiPath)) {
        const swaggerDocument = yamljs_1.default.load(openapiPath);
        app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
        console.log('Swagger documentation loaded successfully');
    }
    else {
        console.warn('OpenAPI specification file not found at:', openapiPath);
        app.use('/docs', (req, res) => {
            res.status(404).send('API documentation not available');
        });
    }
}
catch (error) {
    console.error('Failed to load Swagger documentation:', error);
}
// Root endpoint
app.get('/', (req, res) => {
    res.send({
        message: 'Solana NFT MCP Server',
        documentation: '/docs',
        version: '1.0.0'
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
});
// Start server
app.listen(env_1.config.port, () => {
    console.log(`Server running in ${env_1.config.nodeEnv} mode on port ${env_1.config.port}`);
    console.log(`API documentation available at http://localhost:${env_1.config.port}/docs`);
    // Display API key status
    console.log(`Helius API Key: ${env_1.config.heliusApiKey ? 'Configured' : 'Missing'}`);
    console.log(`Magic Eden API Key: ${env_1.config.magicEdenApiKey ? 'Configured (needed only for listing/delisting)' : 'Not configured (only needed for listing/delisting)'}`);
});
