/*
  Warnings:

  - You are about to drop the column `color` on the `account_categories` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `account_categories` table. All the data in the column will be lost.
  - You are about to drop the column `icon_color` on the `account_categories` table. All the data in the column will be lost.
  - Added the required column `color` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon_color` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_categories" DROP COLUMN "color",
DROP COLUMN "icon",
DROP COLUMN "icon_color";

-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "icon_color" TEXT NOT NULL;
