import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/Wallet';
import { Organization } from './entities/Organization';
import { TokenizedProject } from './entities/TokenizedProject';
import { Retirement } from './entities/Retirement';
import { AuditLog } from './entities/AuditLog';
import { DB_HOST, NODE_ENV, DB_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } from '../config/constants';

// Define the AppDataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt((DB_PORT || '5432').toString(), 10),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  synchronize: NODE_ENV === 'development',
  logging: false,
  entities: [Wallet, Organization, TokenizedProject, Retirement, AuditLog],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  subscribers: [],
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