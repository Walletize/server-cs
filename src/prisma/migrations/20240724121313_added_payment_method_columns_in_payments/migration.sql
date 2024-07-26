/*
  Warnings:

  - Added the required column `status` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "card_type" TEXT,
ADD COLUMN     "cardholder_name" TEXT,
ADD COLUMN     "expiry_month" TEXT,
ADD COLUMN     "expiry_year" TEXT,
ADD COLUMN     "last_4" TEXT,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "payment_date" DROP NOT NULL;
