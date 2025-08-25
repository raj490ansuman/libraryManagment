-- AlterTable
ALTER TABLE `suggestion` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Suggestion_deleted_at_idx` ON `Suggestion`(`deleted_at`);
