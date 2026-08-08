import cron from "node-cron";
import { LessThanOrEqual } from "typeorm";
import { User } from "../Entities/user";
import { Login } from "../Entities/login";
import { ContactUs } from "../Entities/ContactUs";

// Enforces docs/Data-Retention-Policy.md Section 3: hard-deletes data once
// its retention period has elapsed. Runs once daily -- this is disposal of
// already-expired data, not a time-sensitive operation, so sub-minute
// scheduling (as used elsewhere for data ingestion) isn't needed here.

const USER_POST_CLOSURE_RETENTION_DAYS = 90;
const CONTACT_US_RETENTION_DAYS = 365 * 2;

async function deleteClosedAccountsPastRetention(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - USER_POST_CLOSURE_RETENTION_DAYS);

  const closedUsers = await User.find({
    where: { deactivatedAt: LessThanOrEqual(cutoff) },
    select: ["userId"],
  });

  for (const { userId } of closedUsers) {
    // Login rows first -- User is the parent record for this relationship.
    await Login.delete({ userId });
    await User.delete({ userId });
  }

  if (closedUsers.length > 0) {
    // tslint:disable-next-line:no-console
    console.log(`[DataRetentionCronJob] Deleted ${closedUsers.length} account(s) past the ${USER_POST_CLOSURE_RETENTION_DAYS}-day post-closure retention period.`);
  }
}

async function deleteExpiredContactUsSubmissions(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CONTACT_US_RETENTION_DAYS);

  const result = await ContactUs.delete({ createdAt: LessThanOrEqual(cutoff) });

  if (result.affected) {
    // tslint:disable-next-line:no-console
    console.log(`[DataRetentionCronJob] Deleted ${result.affected} ContactUs submission(s) past the ${CONTACT_US_RETENTION_DAYS / 365}-year retention period.`);
  }
}

export const startDataRetentionCronJob = (): void => {
  // Runs daily at 02:00 server time -- low-traffic window, no urgency to
  // run more often since this is cleaning up data that's already expired.
  cron.schedule("0 2 * * *", async () => {
    try {
      await deleteClosedAccountsPastRetention();
      await deleteExpiredContactUsSubmissions();
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error("[DataRetentionCronJob] Failed:", err);
    }
  });
};
