import cron from "node-cron";
import { FTPReadAllControllerRead } from "../controller/FTPUpload";

let lastRunTime: number | null = null;

export const BatchFileExecution = () => {
  // Runs every 5 seconds
  cron.schedule("*/5 * * * * *", async function () {
    const now = Date.now();

    // If it's the first time or 48 hours (in ms) have passed since last execution
    if (!lastRunTime || now - lastRunTime >= 48 * 60 * 60 * 1000) {
      console.log("🔁 Running cron job after 48 hours...");

      // Run your desired function here
      await FTPReadAllControllerRead();

      lastRunTime = now; // Update the last run timestamp
      console.log("✅ Cron job executed at:", new Date().toLocaleString());
    } else {
      const nextAllowedRun = new Date(lastRunTime + 48 * 60 * 60 * 1000);
      console.log("⏳ Not yet 48 hours. Next run allowed after:", nextAllowedRun.toLocaleString());
    }
  });
};
