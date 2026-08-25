-- CreateTable
CREATE TABLE "ProductSimilar" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "similarProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSimilar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSimilar_productId_similarProductId_key" ON "ProductSimilar"("productId", "similarProductId");

-- AddForeignKey
ALTER TABLE "ProductSimilar" ADD CONSTRAINT "ProductSimilar_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSimilar" ADD CONSTRAINT "ProductSimilar_similarProductId_fkey" FOREIGN KEY ("similarProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
