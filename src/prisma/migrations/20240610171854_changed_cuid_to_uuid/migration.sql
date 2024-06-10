/*
  Warnings:

  - Added the required column `icon` to the `account_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_categories" ADD COLUMN     "icon" TEXT NOT NULL;
