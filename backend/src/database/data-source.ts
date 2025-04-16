import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/Wallet';
import { Organization } from './entities/Organization';
import { TokenizedProject } from './entities/TokenizedProject';
import { Retirement } from './entities/Retirement';
import { AuditLog } from './entities/AuditLog';
import { DB_URL, NODE_ENV } from '../config/constants';

// Define the AppDataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DB_URL,
  ssl: {
    rejectUnauthorized: false
  },
  synchronize: NODE_ENV === 'development',
  logging: false, 
  entities: [Wallet, Organization, TokenizedProject, Retirement, AuditLog],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  subscribers: []
});

// Para uso em testes com SQLite
export const getTestDataSource = () => {
  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    dropSchema: true,
    entities: [Wallet, Organization, TokenizedProject, Retirement, AuditLog],
    logging: false
  });
}; 