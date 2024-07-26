/*
  Warnings:

  - Made the column `user_id` on table `oauth_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider_id` on table `oauth_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider_user_id` on table `oauth_accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "oauth_accounts" DROP CONSTRAINT "oauth_accounts_user_id_fkey";

-- DropIndex
DROP INDEX "oauth_accounts_provider_user_id_key";

-- AlterTable
ALTER TABLE "oauth_accounts" ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "provider_id" SET NOT NULL,
ALTER COLUMN "provider_user_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
