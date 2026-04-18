-- CreateTable
CREATE TABLE `entrada_records` (
    `id` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `materiaPrima` VARCHAR(191) NOT NULL,
    `fornecedor` VARCHAR(191) NOT NULL,
    `faturaN` VARCHAR(191) NULL,
    `veiculoOk` BOOLEAN NOT NULL,
    `embalagemOk` BOOLEAN NOT NULL,
    `rotulagemOk` BOOLEAN NOT NULL,
    `produtoOk` BOOLEAN NOT NULL,
    `temperatura` DOUBLE NULL,
    `lote` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` VARCHAR(191) NOT NULL,
    `operatorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `higienizacao_records` (
    `id` VARCHAR(191) NOT NULL,
    `zona` ENUM('COZINHA', 'PRODUCAO', 'ARMAZEM', 'SERVICO') NOT NULL,
    `dia` DATETIME(3) NOT NULL,
    `itens` JSON NOT NULL,
    `observacoes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` VARCHAR(191) NOT NULL,
    `operatorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `desinfecao_records` (
    `id` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `generosAlimenticios` VARCHAR(191) NOT NULL,
    `nomeDesinfetante` VARCHAR(191) NOT NULL,
    `dose` VARCHAR(191) NOT NULL,
    `quantidadeAgua` VARCHAR(191) NOT NULL,
    `tempoAtuacao` VARCHAR(191) NOT NULL,
    `observacoes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` VARCHAR(191) NOT NULL,
    `operatorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oleo_fritura_records` (
    `id` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `fritadeira` VARCHAR(191) NOT NULL,
    `temperatura` DOUBLE NOT NULL,
    `resultado` INTEGER NOT NULL,
    `acoes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` VARCHAR(191) NOT NULL,
    `responsavelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `entrada_records` ADD CONSTRAINT `entrada_records_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entrada_records` ADD CONSTRAINT `entrada_records_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `higienizacao_records` ADD CONSTRAINT `higienizacao_records_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `higienizacao_records` ADD CONSTRAINT `higienizacao_records_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `desinfecao_records` ADD CONSTRAINT `desinfecao_records_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `desinfecao_records` ADD CONSTRAINT `desinfecao_records_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oleo_fritura_records` ADD CONSTRAINT `oleo_fritura_records_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oleo_fritura_records` ADD CONSTRAINT `oleo_fritura_records_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
