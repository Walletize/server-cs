-- AlterTable
ALTER TABLE "subscription_history" ALTER COLUMN "start_date" DROP NOT NULL,
ALTER COLUMN "end_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "end_date" DROP NOT NULL,
ALTER COLUMN "start_date" DROP NOT NULL;
