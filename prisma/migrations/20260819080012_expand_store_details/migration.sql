/*
  Warnings:

  - You are about to drop the column `hours` on the `Store` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Store" DROP COLUMN "hours",
ADD COLUMN     "holidayNote" TEXT,
ADD COLUMN     "hoursSaturday" TEXT,
ADD COLUMN     "hoursSunday" TEXT,
ADD COLUMN     "hoursWeekday" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "mapEmbedUrl" TEXT,
ADD COLUMN     "services" TEXT;
