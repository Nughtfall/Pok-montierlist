-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'ANNOUNCED', 'UNRELEASED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'OFFICIAL', 'COMMUNITY', 'UNVERIFIED', 'UNRELEASED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "BattleFormat" AS ENUM ('SINGLES', 'DOUBLES');

-- CreateEnum
CREATE TYPE "TierRank" AS ENUM ('S_PLUS', 'S', 'A_PLUS', 'A', 'B_PLUS', 'B', 'C', 'D', 'UNTIERED');

-- CreateEnum
CREATE TYPE "MoveCategory" AS ENUM ('PHYSICAL', 'SPECIAL', 'STATUS');

-- CreateEnum
CREATE TYPE "VoteValue" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Pokemon" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationalDexNumber" INTEGER,
    "artworkUrl" TEXT,
    "primaryType" TEXT,
    "secondaryType" TEXT,
    "competitiveRole" TEXT,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonForm" (
    "id" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryType" TEXT,
    "secondaryType" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "PokemonForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionsAvailability" (
    "id" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "availableAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ChampionsAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "BattleFormat" NOT NULL,
    "description" TEXT,
    "restrictions" TEXT,
    "teamSizeLimit" INTEGER,
    "moveLimit" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulationPokemon" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "formId" TEXT,
    "isLegal" BOOLEAN NOT NULL,
    "notes" TEXT,

    CONSTRAINT "RegulationPokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "category" "MoveCategory",
    "power" INTEGER,
    "accuracy" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effect" TEXT,
    "availability" "AvailabilityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonMove" (
    "pokemonId" TEXT NOT NULL,
    "moveId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PokemonMove_pkey" PRIMARY KEY ("pokemonId","moveId")
);

-- CreateTable
CREATE TABLE "RegulationMove" (
    "regulationId" TEXT NOT NULL,
    "moveId" TEXT NOT NULL,
    "isLegal" BOOLEAN NOT NULL,

    CONSTRAINT "RegulationMove_pkey" PRIMARY KEY ("regulationId","moveId")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effect" TEXT,
    "availability" "AvailabilityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonAbility" (
    "pokemonId" TEXT NOT NULL,
    "abilityId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PokemonAbility_pkey" PRIMARY KEY ("pokemonId","abilityId")
);

-- CreateTable
CREATE TABLE "RegulationAbility" (
    "regulationId" TEXT NOT NULL,
    "abilityId" TEXT NOT NULL,
    "isLegal" BOOLEAN NOT NULL,

    CONSTRAINT "RegulationAbility_pkey" PRIMARY KEY ("regulationId","abilityId")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effect" TEXT,
    "availability" "AvailabilityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonItem" (
    "pokemonId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PokemonItem_pkey" PRIMARY KEY ("pokemonId","itemId")
);

-- CreateTable
CREATE TABLE "RegulationItem" (
    "regulationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isLegal" BOOLEAN NOT NULL,

    CONSTRAINT "RegulationItem_pkey" PRIMARY KEY ("regulationId","itemId")
);

-- CreateTable
CREATE TABLE "TierList" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "format" "BattleFormat" NOT NULL,
    "name" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierEntry" (
    "id" TEXT NOT NULL,
    "tierListId" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "tier" "TierRank" NOT NULL,
    "ranking" INTEGER NOT NULL,
    "explanation" TEXT,
    "rankedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierHistory" (
    "id" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "format" "BattleFormat" NOT NULL,
    "previousTier" "TierRank",
    "newTier" "TierRank" NOT NULL,
    "ranking" INTEGER NOT NULL,
    "explanation" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageStatistic" (
    "id" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "format" "BattleFormat" NOT NULL,
    "sampleSize" INTEGER,
    "usageRate" DECIMAL(7,4),
    "winRate" DECIMAL(7,4),
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',

    CONSTRAINT "UsageStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "BattleFormat" NOT NULL,
    "shareSlug" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPokemon" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "formId" TEXT,
    "abilityId" TEXT,
    "itemId" TEXT,
    "position" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "TeamPokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPokemonMove" (
    "teamPokemonId" TEXT NOT NULL,
    "moveId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TeamPokemonMove_pkey" PRIMARY KEY ("teamPokemonId","moveId")
);

-- CreateTable
CREATE TABLE "CommunityTierList" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "format" "BattleFormat" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityTierList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityTierEntry" (
    "id" TEXT NOT NULL,
    "tierListId" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "tier" "TierRank" NOT NULL,
    "ranking" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "CommunityTierEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierListId" TEXT NOT NULL,
    "value" "VoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tierListId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "accessedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataVerification" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "checkedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_slug_key" ON "Pokemon"("slug");

-- CreateIndex
CREATE INDEX "Pokemon_name_idx" ON "Pokemon"("name");

-- CreateIndex
CREATE INDEX "Pokemon_verificationStatus_idx" ON "Pokemon"("verificationStatus");

-- CreateIndex
CREATE INDEX "PokemonForm_name_idx" ON "PokemonForm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonForm_pokemonId_slug_key" ON "PokemonForm"("pokemonId", "slug");

-- CreateIndex
CREATE INDEX "ChampionsAvailability_status_idx" ON "ChampionsAvailability"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionsAvailability_pokemonId_key" ON "ChampionsAvailability"("pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_slug_key" ON "Regulation"("slug");

-- CreateIndex
CREATE INDEX "Regulation_format_isCurrent_idx" ON "Regulation"("format", "isCurrent");

-- CreateIndex
CREATE INDEX "Regulation_verificationStatus_idx" ON "Regulation"("verificationStatus");

-- CreateIndex
CREATE INDEX "RegulationPokemon_regulationId_isLegal_idx" ON "RegulationPokemon"("regulationId", "isLegal");

-- CreateIndex
CREATE INDEX "RegulationPokemon_pokemonId_idx" ON "RegulationPokemon"("pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationPokemon_regulationId_pokemonId_formId_key" ON "RegulationPokemon"("regulationId", "pokemonId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "Move_slug_key" ON "Move"("slug");

-- CreateIndex
CREATE INDEX "Move_name_idx" ON "Move"("name");

-- CreateIndex
CREATE INDEX "Move_availability_idx" ON "Move"("availability");

-- CreateIndex
CREATE INDEX "PokemonMove_moveId_idx" ON "PokemonMove"("moveId");

-- CreateIndex
CREATE INDEX "RegulationMove_moveId_idx" ON "RegulationMove"("moveId");

-- CreateIndex
CREATE UNIQUE INDEX "Ability_slug_key" ON "Ability"("slug");

-- CreateIndex
CREATE INDEX "Ability_name_idx" ON "Ability"("name");

-- CreateIndex
CREATE INDEX "Ability_availability_idx" ON "Ability"("availability");

-- CreateIndex
CREATE INDEX "PokemonAbility_abilityId_idx" ON "PokemonAbility"("abilityId");

-- CreateIndex
CREATE INDEX "RegulationAbility_abilityId_idx" ON "RegulationAbility"("abilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_slug_key" ON "Item"("slug");

-- CreateIndex
CREATE INDEX "Item_name_idx" ON "Item"("name");

-- CreateIndex
CREATE INDEX "Item_availability_idx" ON "Item"("availability");

-- CreateIndex
CREATE INDEX "PokemonItem_itemId_idx" ON "PokemonItem"("itemId");

-- CreateIndex
CREATE INDEX "RegulationItem_itemId_idx" ON "RegulationItem"("itemId");

-- CreateIndex
CREATE INDEX "TierList_publishedAt_idx" ON "TierList"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TierList_regulationId_format_name_key" ON "TierList"("regulationId", "format", "name");

-- CreateIndex
CREATE INDEX "TierEntry_tierListId_tier_idx" ON "TierEntry"("tierListId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "TierEntry_tierListId_pokemonId_key" ON "TierEntry"("tierListId", "pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "TierEntry_tierListId_ranking_key" ON "TierEntry"("tierListId", "ranking");

-- CreateIndex
CREATE INDEX "TierHistory_pokemonId_changedAt_idx" ON "TierHistory"("pokemonId", "changedAt");

-- CreateIndex
CREATE INDEX "TierHistory_regulationId_format_idx" ON "TierHistory"("regulationId", "format");

-- CreateIndex
CREATE INDEX "UsageStatistic_regulationId_format_recordedAt_idx" ON "UsageStatistic"("regulationId", "format", "recordedAt");

-- CreateIndex
CREATE INDEX "UsageStatistic_verificationStatus_idx" ON "UsageStatistic"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStatistic_pokemonId_regulationId_format_recordedAt_key" ON "UsageStatistic"("pokemonId", "regulationId", "format", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_shareSlug_key" ON "Team"("shareSlug");

-- CreateIndex
CREATE INDEX "Team_ownerId_updatedAt_idx" ON "Team"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "Team_regulationId_format_idx" ON "Team"("regulationId", "format");

-- CreateIndex
CREATE INDEX "TeamPokemon_teamId_idx" ON "TeamPokemon"("teamId");

-- CreateIndex
CREATE INDEX "TeamPokemon_pokemonId_idx" ON "TeamPokemon"("pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPokemon_teamId_position_key" ON "TeamPokemon"("teamId", "position");

-- CreateIndex
CREATE INDEX "TeamPokemonMove_moveId_idx" ON "TeamPokemonMove"("moveId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPokemonMove_teamPokemonId_position_key" ON "TeamPokemonMove"("teamPokemonId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTierList_slug_key" ON "CommunityTierList"("slug");

-- CreateIndex
CREATE INDEX "CommunityTierList_authorId_updatedAt_idx" ON "CommunityTierList"("authorId", "updatedAt");

-- CreateIndex
CREATE INDEX "CommunityTierList_regulationId_format_idx" ON "CommunityTierList"("regulationId", "format");

-- CreateIndex
CREATE INDEX "CommunityTierEntry_tierListId_tier_idx" ON "CommunityTierEntry"("tierListId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTierEntry_tierListId_pokemonId_key" ON "CommunityTierEntry"("tierListId", "pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTierEntry_tierListId_ranking_key" ON "CommunityTierEntry"("tierListId", "ranking");

-- CreateIndex
CREATE INDEX "Vote_tierListId_value_idx" ON "Vote"("tierListId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_tierListId_key" ON "Vote"("userId", "tierListId");

-- CreateIndex
CREATE INDEX "Favorite_pokemonId_idx" ON "Favorite"("pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_pokemonId_key" ON "Favorite"("userId", "pokemonId");

-- CreateIndex
CREATE INDEX "Comment_tierListId_createdAt_idx" ON "Comment"("tierListId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "DataSource_isOfficial_idx" ON "DataSource"("isOfficial");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_url_key" ON "DataSource"("url");

-- CreateIndex
CREATE INDEX "DataVerification_entityType_entityId_idx" ON "DataVerification"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DataVerification_status_checkedAt_idx" ON "DataVerification"("status", "checkedAt");

-- CreateIndex
CREATE INDEX "DataVerification_sourceId_idx" ON "DataVerification"("sourceId");

-- CreateIndex
CREATE INDEX "ChangeLog_entityType_entityId_createdAt_idx" ON "ChangeLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ChangeLog_changedById_idx" ON "ChangeLog"("changedById");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonForm" ADD CONSTRAINT "PokemonForm_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionsAvailability" ADD CONSTRAINT "ChampionsAvailability_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationPokemon" ADD CONSTRAINT "RegulationPokemon_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationPokemon" ADD CONSTRAINT "RegulationPokemon_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationPokemon" ADD CONSTRAINT "RegulationPokemon_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonMove" ADD CONSTRAINT "PokemonMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationMove" ADD CONSTRAINT "RegulationMove_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationMove" ADD CONSTRAINT "RegulationMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonAbility" ADD CONSTRAINT "PokemonAbility_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationAbility" ADD CONSTRAINT "RegulationAbility_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationAbility" ADD CONSTRAINT "RegulationAbility_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonItem" ADD CONSTRAINT "PokemonItem_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonItem" ADD CONSTRAINT "PokemonItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationItem" ADD CONSTRAINT "RegulationItem_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationItem" ADD CONSTRAINT "RegulationItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierList" ADD CONSTRAINT "TierList_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierEntry" ADD CONSTRAINT "TierEntry_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "TierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierEntry" ADD CONSTRAINT "TierEntry_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierHistory" ADD CONSTRAINT "TierHistory_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierHistory" ADD CONSTRAINT "TierHistory_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageStatistic" ADD CONSTRAINT "UsageStatistic_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageStatistic" ADD CONSTRAINT "UsageStatistic_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemon" ADD CONSTRAINT "TeamPokemon_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemon" ADD CONSTRAINT "TeamPokemon_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemon" ADD CONSTRAINT "TeamPokemon_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemon" ADD CONSTRAINT "TeamPokemon_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemon" ADD CONSTRAINT "TeamPokemon_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemonMove" ADD CONSTRAINT "TeamPokemonMove_teamPokemonId_fkey" FOREIGN KEY ("teamPokemonId") REFERENCES "TeamPokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPokemonMove" ADD CONSTRAINT "TeamPokemonMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTierList" ADD CONSTRAINT "CommunityTierList_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTierList" ADD CONSTRAINT "CommunityTierList_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTierEntry" ADD CONSTRAINT "CommunityTierEntry_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "CommunityTierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTierEntry" ADD CONSTRAINT "CommunityTierEntry_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "CommunityTierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_tierListId_fkey" FOREIGN KEY ("tierListId") REFERENCES "CommunityTierList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataVerification" ADD CONSTRAINT "DataVerification_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataVerification" ADD CONSTRAINT "DataVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
