import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './utils/createDataSourceOptions';

dotenv.config({
    path: ['.env', '../../.env'],
    quiet: true,
    override: false, // ensures first-found variable wins
});

export const AppDataSource = new DataSource(
    createDataSourceOptions({
        url: String(Bun.env.DATABASE_URL),
    })
);
