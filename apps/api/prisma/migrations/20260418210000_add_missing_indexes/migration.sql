-- Missing performance indexes identified in audit

-- Users by client (for CLIENT_ADMIN filtering)
CREATE INDEX IF NOT EXISTS `users_clientId_idx` ON `users`(`clientId`);

-- Areas by client
CREATE INDEX IF NOT EXISTS `areas_clientId_idx` ON `areas`(`clientId`);

-- Anomaly reports by status and area/client
CREATE INDEX IF NOT EXISTS `anomaly_reports_status_idx` ON `anomaly_reports`(`status`);
CREATE INDEX IF NOT EXISTS `anomaly_reports_areaId_createdAt_idx` ON `anomaly_reports`(`areaId`, `createdAt`);

-- Orders by client and createdAt
CREATE INDEX IF NOT EXISTS `orders_clientId_createdAt_idx` ON `orders`(`clientId`, `createdAt`);

-- Consumable reports by stock
CREATE INDEX IF NOT EXISTS `consumable_reports_stockId_createdAt_idx` ON `consumable_reports`(`stockId`, `createdAt`);
CREATE INDEX IF NOT EXISTS `consumable_reports_status_idx` ON `consumable_reports`(`status`);

-- Consumable stock by client
CREATE INDEX IF NOT EXISTS `consumable_stocks_clientId_idx` ON `consumable_stocks`(`clientId`);

-- Temperature equipment by client
CREATE INDEX IF NOT EXISTS `temperature_equipment_clientId_active_idx` ON `temperature_equipment`(`clientId`, `active`);
