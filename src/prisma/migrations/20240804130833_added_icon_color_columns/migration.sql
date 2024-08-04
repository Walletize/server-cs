/*
  Warnings:

  - Added the required column `icon_color` to the `account_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon_color` to the `transaction_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_categories" ADD COLUMN     "icon_color" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transaction_categories" ADD COLUMN     "icon_color" TEXT NOT NULL;
