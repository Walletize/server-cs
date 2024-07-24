/*
  Warnings:

  - The `expiry_month` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `expiry_year` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "expiry_month",
ADD COLUMN     "expiry_month" INTEGER,
DROP COLUMN "expiry_year",
ADD COLUMN     "expiry_year" INTEGER;
