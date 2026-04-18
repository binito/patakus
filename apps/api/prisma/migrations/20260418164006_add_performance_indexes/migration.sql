-- CreateIndex
CREATE INDEX `checklist_entries_areaId_completedAt_idx` ON `checklist_entries`(`areaId`, `completedAt`);

-- CreateIndex
CREATE INDEX `desinfecao_records_clientId_data_idx` ON `desinfecao_records`(`clientId`, `data`);

-- CreateIndex
CREATE INDEX `entrada_records_clientId_data_idx` ON `entrada_records`(`clientId`, `data`);

-- CreateIndex
CREATE INDEX `higienizacao_records_clientId_dia_idx` ON `higienizacao_records`(`clientId`, `dia`);

-- CreateIndex
CREATE INDEX `oleo_fritura_records_clientId_data_idx` ON `oleo_fritura_records`(`clientId`, `data`);

-- CreateIndex
CREATE INDEX `temperature_records_equipmentId_recordedAt_idx` ON `temperature_records`(`equipmentId`, `recordedAt`);
