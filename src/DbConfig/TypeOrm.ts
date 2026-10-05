import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { getDbPassword } from "../helpers/dbPassword";
dotenv.config(); 
export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as any,  
    host: process.env.DB_HOST ,
    port:  process.env.DB_PORT as any ,
    username: process.env.DB_USERNAME ,
    password: getDbPassword,
    database: process.env.DB_DATABASE ,
    ssl: true,
    synchronize: false,
    extra: {
      ssl: {
        rejectUnauthorized: false 
      }
    },
    entities: ["src/Entities/**/*.ts"],
    migrations: ["src/Entities/migration/**/*.ts"],  
    subscribers: ["src/Entities/subscriber/**/*.ts"],
});