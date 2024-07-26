/*
  Warnings:

  - You are about to drop the column `card_type` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `cardholder_name` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_month` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_year` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `last_4` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "card_type",
DROP COLUMN "cardholder_name",
DROP COLUMN "expiry_month",
DROP COLUMN "expiry_year",
DROP COLUMN "last_4";
