/*
  Warnings:

  - You are about to drop the column `transaction_id` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "transaction_id";
