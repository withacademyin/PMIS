-- CreateExtension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure geography and vector types on columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ITI' AND column_name = 'location' AND udt_name != 'geography'
    ) THEN
        ALTER TABLE "ITI" ALTER COLUMN "location" TYPE geography(Point, 4326) USING location::geography;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'WorkerProfile' AND column_name = 'location' AND udt_name != 'geography'
    ) THEN
        ALTER TABLE "WorkerProfile" ALTER COLUMN "location" TYPE geography(Point, 4326) USING location::geography;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TradeSkill' AND column_name = 'embedding' AND udt_name != 'vector'
    ) THEN
        ALTER TABLE "TradeSkill" ALTER COLUMN "embedding" TYPE vector USING embedding::vector;
    END IF;
END $$;

-- Spatial Indexes for radius queries
CREATE INDEX IF NOT EXISTS "ITI_location_idx" ON "ITI" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "WorkerProfile_location_idx" ON "WorkerProfile" USING GIST ("location");
