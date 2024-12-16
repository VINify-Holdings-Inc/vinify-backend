import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as "postgres",   
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "MErn@6388",
    database: process.env.DB_DATABASE || "mvm",
    synchronize: true,
    entities: ["src/Entities/**/*.ts"],
    migrations: ["src/Entities/migration/**/*.ts"], // code-first approach
    subscribers: ["src/Entities/subscriber/**/*.ts"],
});
