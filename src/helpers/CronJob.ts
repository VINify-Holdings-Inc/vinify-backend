// import cron from "node-cron";
//  import {FTPReadAllControllerRead} from '../controller/FTPUpload'
// let lastRunTime: number | null = null;

export const BatchFileExecution = () => {
    // cron.schedule(
    //     "0 0 * * *", // Every day at 00:00 UTC
    //     async function () {
    //         const now = Date.now();

    //         // Run if first time or if 48 hours have passed
    //         if (!lastRunTime || now - lastRunTime >= 48 * 60 * 60 * 1000) {
    //             console.log("Running cron after 48 hours");

    //             await FTPReadAllControllerRead();
    //             lastRunTime = now;

    //             console.log("Cron job executed at:", new Date().toISOString()); // Logs in UTC
    //         } else {
    //             console.log("48 hours not reached yet:", new Date().toISOString()); // Logs in UTC
    //         }
    //     },
    //     {
    //         timezone: "UTC", // <== Ensures cron uses UTC
    //     }
    // );
};



// export const BatchFileExecution = () => { 
//     cron.schedule("*/30 * * * *", async function() {
//       console.log("hellow cron")   
//         await FTPReadAllController();
//         // tslint:disable-next-line:no-console
//         console.log("Cron job executed at:", new Date().toLocaleString());
//     });
// };
