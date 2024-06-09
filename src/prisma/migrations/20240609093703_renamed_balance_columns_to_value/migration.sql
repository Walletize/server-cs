/*
  Warnings:

  - You are about to drop the column `currentBalance` on the `financial_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `initialBalance` on the `financial_accounts` table. All the data in the column will be lost.
  - Added the required column `currentValue` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialValue` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "financial_accounts" DROP COLUMN "currentBalance",
DROP COLUMN "initialBalance",
ADD COLUMN     "currentValue" BIGINT NOT NULL,
ADD COLUMN     "initialValue" BIGINT NOT NULL;
