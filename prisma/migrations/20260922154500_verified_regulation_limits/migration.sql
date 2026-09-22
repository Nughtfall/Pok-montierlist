-- Existing development databases may predate source-verified team limits.
-- IF NOT EXISTS also keeps fresh installs compatible with the consolidated
-- initial migration generated for this previously empty repository.
ALTER TABLE "Regulation" ADD COLUMN IF NOT EXISTS "teamSizeLimit" INTEGER;
ALTER TABLE "Regulation" ADD COLUMN IF NOT EXISTS "moveLimit" INTEGER;
