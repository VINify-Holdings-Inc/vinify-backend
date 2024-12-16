import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();
//ghg
// export const AppDataSource = new DataSource({
//     type: process.env.DB_TYPE as "postgres",   
//     host: process.env.DB_HOST || "127.0.0.1",
//     port: parseInt(process.env.DB_PORT || "5432"),
//     username: process.env.DB_USERNAME || "postgres",
//     password: process.env.DB_PASSWORD || "MErn@6388",
//     database: process.env.DB_DATABASE || "mvm",
//     synchronize: true,
//     entities: ["src/Entities/**/*.ts"],
//     migrations: ["src/Entities/migration/**/*.ts"], // code-first approach
//     subscribers: ["src/Entities/subscriber/**/*.ts"],
// });
export const AppDataSource = new DataSource({
    type:"postgres",   
    host:'ls-fd2a1baa99a970a9bb4d7350b6ae68e7c0291163.cvzv7bthfyp2.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || "5432"),
    username:'dbmasteruser',
    password: 'tEun`42MyUF,7y;maVFX$*|}:3>U;|8v',
    database: "mvm",
    synchronize: true,
    entities: ["src/Entities/**/*.ts"],
    migrations: ["src/Entities/migration/**/*.ts"], // code-first approach
    subscribers: ["src/Entities/subscriber/**/*.ts"],
});

 