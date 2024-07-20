-- DropForeignKey
ALTER TABLE "email_verification_codes" DROP CONSTRAINT "email_verification_codes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "oauth_accounts" DROP CONSTRAINT "oauth_accounts_user_id_fkey";

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
