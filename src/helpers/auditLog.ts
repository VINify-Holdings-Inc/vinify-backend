// Structured, user-identity-tied security event log -- see
// docs/AWS-Security-Setup-Guide.md Section 4 (LM02). Emitted via console.log
// so it flows through the existing PM2 stdout -> CloudWatch agent pipeline
// (/vinify/ec2/pm2-out) with no infrastructure changes -- filterable by the
// "AUDIT " prefix. Nginx access logs already show that a request hit
// /api/user-login with a status code; this fills the gap nginx can't --
// tying the event to which user it actually was, since that's in the
// request body, not the URL.
export type AuditOutcome = "success" | "failure";

export interface AuditEvent {
  userId: string | null;
  eventType: string;
  outcome: AuditOutcome;
  resource: string;
  detail?: string;
}

export const auditLog = (event: AuditEvent): void => {
  const record = {
    timestamp: new Date().toISOString(),
    userId: event.userId,
    eventType: event.eventType,
    outcome: event.outcome,
    resource: event.resource,
    ...(event.detail ? { detail: event.detail } : {}),
  };
  // tslint:disable-next-line:no-console
  console.log(`AUDIT ${JSON.stringify(record)}`);
};
