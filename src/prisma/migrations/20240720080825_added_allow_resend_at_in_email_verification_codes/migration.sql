/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `email_verification_codes` table. All the data in the column will be lost.
  - Added the required column `allow_resend_at` to the `email_verification_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `email_verification_codes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email_verification_codes" DROP COLUMN "expiresAt",
ADD COLUMN     "allow_resend_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;
