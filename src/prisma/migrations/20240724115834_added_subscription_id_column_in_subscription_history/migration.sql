/*
  Warnings:

  - You are about to drop the column `plan_id` on the `subscription_history` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `subscription_history` table. All the data in the column will be lost.
  - Added the required column `subscription_id` to the `subscription_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscription_history" DROP CONSTRAINT "subscription_history_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_history" DROP CONSTRAINT "subscription_history_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_history" DROP CONSTRAINT "subscription_history_user_id_fkey";

-- AlterTable
ALTER TABLE "subscription_history" DROP COLUMN "plan_id",
DROP COLUMN "user_id",
ADD COLUMN     "subscription_id" TEXT NOT NULL,
ALTER COLUMN "payment_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
