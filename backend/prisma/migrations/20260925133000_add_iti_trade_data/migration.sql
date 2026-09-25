ALTER TABLE "ITI"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "pincode" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "sourcePage" INTEGER,
  ADD COLUMN "ncvtDetailUrl" TEXT,
  ADD COLUMN "trades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "tradesDataStatus" TEXT;