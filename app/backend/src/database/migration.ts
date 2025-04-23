import { AppDataSource } from './data-source';
import { NODE_ENV } from '../config/constants';

/**
 * Function to execute the database migration
 */
export const runMigration = async () => {
  try {
    console.log(`Starting migration for environment: ${NODE_ENV}`);
    
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log('Database connection established.');
    
    // Check if there are pending migrations (if not using synchronize)
    if (!AppDataSource.options.synchronize) {
      console.log('Running migrations...');
      const migrations = await AppDataSource.runMigrations();
      console.log(`${migrations.length} migrations executed.`);
    } else {
      console.log('Synchronize mode activated. The schema will be synchronized automatically.');
    }
    
    console.log('Migration completed successfully.');
    
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  } finally {
    // Close the connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.');
    }
  }
};

// Execute the migration if this file is called directly
if (require.main === module) {
  runMigration()
    .then((result) => {
      if (result) {
        console.log('Migration executed successfully.');
        process.exit(0);
      } else {
        console.error('Error executing migration.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}