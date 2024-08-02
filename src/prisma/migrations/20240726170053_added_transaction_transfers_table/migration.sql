-- CreateTable
CREATE TABLE "transaction_transfers" (
    "id" TEXT NOT NULL,
    "originTransactionId" TEXT NOT NULL,
    "destinationTransactionId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_transfers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_transfers" ADD CONSTRAINT "transaction_transfers_originTransactionId_fkey" FOREIGN KEY ("originTransactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfers" ADD CONSTRAINT "transaction_transfers_destinationTransactionId_fkey" FOREIGN KEY ("destinationTransactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
