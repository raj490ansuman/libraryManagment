/*
  Warnings:

  - Added the required column `updatedAt` to the `Suggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `suggestion` ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PURCHASED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `Vote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `suggestionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Vote_suggestionId_idx`(`suggestionId`),
    INDEX `Vote_userId_idx`(`userId`),
    UNIQUE INDEX `Vote_suggestionId_userId_key`(`suggestionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Suggestion_status_idx` ON `Suggestion`(`status`);

-- CreateIndex
CREATE INDEX `Suggestion_createdAt_idx` ON `Suggestion`(`createdAt`);

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_suggestionId_fkey` FOREIGN KEY (`suggestionId`) REFERENCES `Suggestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
