/*
  Warnings:

  - You are about to drop the column `allow_resend_at` on the `email_verification_codes` table. All the data in the column will be lost.
  - Added the required column `timeout_seconds` to the `email_verification_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeout_until` to the `email_verification_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeout_seconds` to the `password_reset_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeout_until` to the `password_reset_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email_verification_codes" DROP COLUMN "allow_resend_at",
ADD COLUMN     "timeout_seconds" INTEGER NOT NULL,
ADD COLUMN     "timeout_until" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "timeout_seconds" INTEGER NOT NULL,
ADD COLUMN     "timeout_until" TIMESTAMP(3) NOT NULL;
