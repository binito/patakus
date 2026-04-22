-- CreateTable
CREATE TABLE `report_shares` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('ENTRADAS', 'HIGIENIZACAO', 'DESINFECAO', 'OLEOS', 'TEMPERATURAS', 'CHECKLISTS') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `params` JSON NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `report_shares_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
