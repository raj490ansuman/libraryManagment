-- AlterTable
ALTER TABLE `book` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Book_deleted_at_idx` ON `Book`(`deleted_at`);
