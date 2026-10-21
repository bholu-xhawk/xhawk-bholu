-- CreateTable
CREATE TABLE "Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo' CHECK ("status" IN ('todo', 'in_progress', 'done')),
    "priority" TEXT NOT NULL DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high')),
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Todo_userId_createdAt_id_idx" ON "Todo"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Todo_userId_dueDate_id_idx" ON "Todo"("userId", "dueDate", "id");

-- CreateIndex
CREATE INDEX "Todo_userId_status_createdAt_id_idx" ON "Todo"("userId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Todo_userId_priority_createdAt_id_idx" ON "Todo"("userId", "priority", "createdAt", "id");
