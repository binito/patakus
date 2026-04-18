-- CreateTable
CREATE TABLE `temperature_equipment` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('FRIDGE', 'FREEZER') NOT NULL DEFAULT 'FRIDGE',
    `location` VARCHAR(191) NULL,
    `minTemp` DOUBLE NULL,
    `maxTemp` DOUBLE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temperature_records` (
    `id` VARCHAR(191) NOT NULL,
    `temperature` DOUBLE NOT NULL,
    `session` ENUM('MORNING', 'EVENING') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `equipmentId` VARCHAR(191) NOT NULL,
    `operatorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `temperature_equipment` ADD CONSTRAINT `temperature_equipment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temperature_records` ADD CONSTRAINT `temperature_records_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `temperature_equipment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temperature_records` ADD CONSTRAINT `temperature_records_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
