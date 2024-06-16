/*
  Warnings:

  - You are about to drop the column `currentValue` on the `financial_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `initialValue` on the `financial_accounts` table. All the data in the column will be lost.
  - Added the required column `current_value` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_value` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "financial_accounts" DROP COLUMN "currentValue",
DROP COLUMN "initialValue",
ADD COLUMN     "current_value" BIGINT NOT NULL,
ADD COLUMN     "initial_value" BIGINT NOT NULL;
