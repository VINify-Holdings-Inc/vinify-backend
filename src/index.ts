import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import routerAdmin from "./route/index";
import { AppDataSource } from "./DbConfig/TypeOrm";
import { throttleMiddleware } from "./middleware/ThrottleMiddleware";

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// static serve path
app.use("/api/uploads", express.static("./src/uploads"));
// cronJob  

// PostgreSQL Database connection
AppDataSource.initialize()
  .then(() => {
    // tslint:disable-next-line:no-console
    console.log("🚀Data Source has been initialized! ✅");
  })
  .catch((err: any) => {
    // tslint:disable-next-line:no-console
    console.error("Error during Data Source initialization", err);
  });

/** Error handling */
app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

app.use("/api", throttleMiddleware, routerAdmin);

app.get("/", throttleMiddleware, (req: any, res: any) => {
  // tslint:disable-next-line:no-console
  res.send("Welcome to the server!!!");
});
 
const PORT = process.env.PORT || 4800;
app.listen(PORT, () => {
  // tslint:disable-next-line:no-console
  console.log("Hi Server is Running 🚀 at Port " + PORT);
});
