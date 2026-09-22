CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "ModerationStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED');

ALTER TABLE "User"
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "CommunityTierList"
  ADD COLUMN "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PUBLISHED';

ALTER TABLE "Comment"
  ADD COLUMN "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "CommunityTierList_moderationStatus_updatedAt_idx"
  ON "CommunityTierList"("moderationStatus", "updatedAt");
CREATE INDEX "Comment_moderationStatus_createdAt_idx"
  ON "Comment"("moderationStatus", "createdAt");
