/*
  Warnings:

  - Added the required column `user_id` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "user_id" TEXT NOT NULL;
