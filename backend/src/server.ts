import 'reflect-metadata';
import app from './config/app';
import { PORT, NODE_ENV } from './config/constants';
import routes from './routes/index';
import { initializeDatabase } from './database';

console.log(`Ambiente: ${NODE_ENV}`);
console.log('Conectando ao banco de dados Supabase...');

// Register API routes
app.use('/api', routes);

// Start the server
const startServer = async () => {
  try {
    // Initialize the database
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
};

// Start the application
startServer();