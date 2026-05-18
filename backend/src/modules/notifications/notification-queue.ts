import { Queue, Worker } from "bullmq";
import { getEnv } from "../../config/env";
import { sendEmail } from "../email/email.service";

type EmailJob = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  organizationId?: number;
};

let queue: Queue<EmailJob> | null = null;
let worker: Worker<EmailJob> | null = null;

function getConnection() {
  const url = getEnv().REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for BullMQ notifications");
  return { url };
}

export function getNotificationQueue(): Queue<EmailJob> {
  if (queue) return queue;
  queue = new Queue<EmailJob>("notifications-email", {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
    },
  });
  return queue;
}

export async function enqueueEmail(job: EmailJob) {
  return getNotificationQueue().add("send-email", job);
}

export function startNotificationWorker() {
  if (worker) return worker;
  worker = new Worker<EmailJob>(
    "notifications-email",
    async (job) => {
      await sendEmail(job.data);
    },
    { connection: getConnection() },
  );
  worker.on("failed", (job, err) => {
    console.error("[notifications] job failed", { jobId: job?.id, err });
  });
  return worker;
}
