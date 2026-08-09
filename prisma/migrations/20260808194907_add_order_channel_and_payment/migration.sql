-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'online',
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "servedBy" TEXT;
