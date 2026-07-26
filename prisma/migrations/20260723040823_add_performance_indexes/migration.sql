-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE INDEX "maintenance_logs_printerId_idx" ON "maintenance_logs"("printerId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_status_logs_orderId_idx" ON "order_status_logs"("orderId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "print_jobs_orderId_idx" ON "print_jobs"("orderId");

-- CreateIndex
CREATE INDEX "print_jobs_printerId_idx" ON "print_jobs"("printerId");

-- CreateIndex
CREATE INDEX "print_jobs_status_idx" ON "print_jobs"("status");

-- CreateIndex
CREATE INDEX "production_checkouts_filamentId_idx" ON "production_checkouts"("filamentId");

-- CreateIndex
CREATE INDEX "production_checkouts_productionLogId_idx" ON "production_checkouts"("productionLogId");

-- CreateIndex
CREATE INDEX "production_checkouts_checkedOutAt_idx" ON "production_checkouts"("checkedOutAt");

-- CreateIndex
CREATE INDEX "production_logs_filamentId_idx" ON "production_logs"("filamentId");

-- CreateIndex
CREATE INDEX "production_logs_producedAt_idx" ON "production_logs"("producedAt");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "purchases_supplierId_idx" ON "purchases"("supplierId");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- CreateIndex
CREATE INDEX "stock_movements_filamentId_idx" ON "stock_movements"("filamentId");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
