import cron from "node-cron"; 
// import { FTPReadAllController } from "../controller/FTPUpload"; 

export const BatchFileExecution = () => { 
    cron.schedule("*/1 * * * *", async function() {
        // await FTPReadAllController();
        // console.log("hi....", new Date().toLocaleString());
    });
};
// 