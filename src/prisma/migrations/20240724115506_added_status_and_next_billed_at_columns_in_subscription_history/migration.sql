/*
  Warnings:

  - Added the required column `status` to the `subscription_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscription_history" ADD COLUMN     "next_billed_at" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL;
