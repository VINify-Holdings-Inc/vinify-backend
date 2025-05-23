import cron from "node-cron"; 
import { FTPReadAllController } from "../controller/FTPUpload"; 

export const BatchFileExecution = () => { 
    cron.schedule("*/30 * * * *", async function() {
      console.log("hellow cron")   
        await FTPReadAllController();
        // tslint:disable-next-line:no-console
        console.log("Cron job executed at:", new Date().toLocaleString());
    });
};
// testCronJob
export const testCronJob = () => { 
    cron.schedule("*/20 * * * * *", async function() { 
        console.log("Cron job executed at:", new Date().toLocaleString());
    });
};