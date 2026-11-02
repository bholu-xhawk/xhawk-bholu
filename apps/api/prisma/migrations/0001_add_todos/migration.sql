-- Add user-owned todos.
CREATE TABLE "Todo" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "ownerId" INTEGER NOT NULL,
  CONSTRAINT "Todo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Todo_ownerId_completed_idx" ON "Todo"("ownerId", "completed");
CREATE INDEX "Todo_ownerId_id_idx" ON "Todo"("ownerId", "id");
