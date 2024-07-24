/*
  Warnings:

  - You are about to drop the column `payment_id` on the `subscription_history` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "subscription_history" DROP CONSTRAINT "subscription_history_payment_id_fkey";

-- AlterTable
ALTER TABLE "subscription_history" DROP COLUMN "payment_id";
