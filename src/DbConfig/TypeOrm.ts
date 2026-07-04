import { DataSource } from "typeorm";
import * as dotenv from "dotenv"; 
dotenv.config(); 
export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as any,  
    host: process.env.DB_HOST ,
    port:  process.env.DB_PORT as any ,
    username: process.env.DB_USERNAME ,
    password: process.env.DB_PASSWORD ,
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

// export const AppDataSource = new DataSource({
//   type: "postgres",  
//   host: "127.0.0.1", 
//   port: 5432, 
//   username: "postgres", 
//   password: "12345", 
//   database: "mvm",  
//   ssl: false, 
//   synchronize: true,  
//   entities: ["src/Entities/**/*.ts"],
//   migrations: ["src/Entities/migration/**/*.ts"],
//   subscribers: ["src/Entities/subscriber/**/*.ts"],
// }); 