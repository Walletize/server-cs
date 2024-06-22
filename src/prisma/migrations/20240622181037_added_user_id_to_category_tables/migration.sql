-- AlterTable
ALTER TABLE "account_categories" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "transaction_categories" ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "account_categories" ADD CONSTRAINT "account_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
