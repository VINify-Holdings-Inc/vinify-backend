import cron from "node-cron"; 
import { FTPReadAllController } from "../controller/FTPUpload"; 

export const BatchFileExecution = () => { 
    cron.schedule("0 */2 * * *", async function() {
        await FTPReadAllController();
         // tslint:disable-next-line:no-console
        console.log("Cron job executed at:", new Date().toLocaleString());
    });
};
// 