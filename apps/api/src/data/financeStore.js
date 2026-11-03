const accountTypes = new Set(['cash', 'checking', 'savings', 'credit', 'investment']);
const categoryTypes = new Set(['income', 'expense']);

let nextAccountId = 1;
let nextCategoryId = 1;
let nextTransactionId = 1;
let accounts = [];
let categories = [];
let transactions = [];

function timestamp() {
  return new Date().toISOString();
}

function clone(record) {
  return record ? { ...record } : null;
}

function scopedUserId(userId) {
  return Number(userId);
}

function findOwned(collection, userId, id) {
  const ownerId = scopedUserId(userId);
  return collection.find((record) => record.userId === ownerId && record.id === id) || null;
}

function listAccounts(userId) {
  const ownerId = scopedUserId(userId);
  return accounts.filter((account) => account.userId === ownerId).map(clone);
}

function getAccount(userId, id) {
  return clone(findOwned(accounts, userId, id));
}

function createAccount(userId, data) {
  const now = timestamp();
  const account = {
    id: nextAccountId++,
    userId: scopedUserId(userId),
    name: data.name,
    type: data.type,
    balance: data.balance,
    createdAt: now,
    updatedAt: now,
  };
  accounts.push(account);
  return clone(account);
}

function updateAccount(userId, id, data) {
  const account = findOwned(accounts, userId, id);
  if (!account) return null;
  Object.assign(account, data, { updatedAt: timestamp() });
  return clone(account);
}

function deleteAccount(userId, id) {
  const account = findOwned(accounts, userId, id);
  if (!account) return { status: 'not_found' };
  const ownerId = scopedUserId(userId);
  const referenced = transactions.some((transaction) => transaction.userId === ownerId && transaction.accountId === id);
  if (referenced) return { status: 'conflict' };
  accounts = accounts.filter((record) => record !== account);
  return { status: 'deleted' };
}

function listCategories(userId) {
  const ownerId = scopedUserId(userId);
  return categories.filter((category) => category.userId === ownerId).map(clone);
}

function getCategory(userId, id) {
  return clone(findOwned(categories, userId, id));
}

function createCategory(userId, data) {
  const now = timestamp();
  const category = {
    id: nextCategoryId++,
    userId: scopedUserId(userId),
    name: data.name,
    type: data.type,
    createdAt: now,
    updatedAt: now,
  };
  categories.push(category);
  return clone(category);
}

function updateCategory(userId, id, data) {
  const category = findOwned(categories, userId, id);
  if (!category) return null;
  Object.assign(category, data, { updatedAt: timestamp() });
  return clone(category);
}

function deleteCategory(userId, id) {
  const category = findOwned(categories, userId, id);
  if (!category) return { status: 'not_found' };
  const ownerId = scopedUserId(userId);
  const referenced = transactions.some((transaction) => transaction.userId === ownerId && transaction.categoryId === id);
  if (referenced) return { status: 'conflict' };
  categories = categories.filter((record) => record !== category);
  return { status: 'deleted' };
}

function validateTransactionReferences(userId, data) {
  const account = findOwned(accounts, userId, data.accountId);
  const category = findOwned(categories, userId, data.categoryId);
  if (!account || !category) return { ok: false, reason: 'missing_reference' };
  if (category.type !== data.type) return { ok: false, reason: 'category_type_mismatch' };
  return { ok: true, account, category };
}

function listTransactions(userId) {
  const ownerId = scopedUserId(userId);
  return transactions.filter((transaction) => transaction.userId === ownerId).map(clone);
}

function getTransaction(userId, id) {
  return clone(findOwned(transactions, userId, id));
}

function createTransaction(userId, data) {
  const references = validateTransactionReferences(userId, data);
  if (!references.ok) return { status: references.reason };

  const now = timestamp();
  const transaction = {
    id: nextTransactionId++,
    userId: scopedUserId(userId),
    accountId: data.accountId,
    categoryId: data.categoryId,
    type: data.type,
    amount: data.amount,
    description: data.description ?? null,
    date: data.date,
    createdAt: now,
    updatedAt: now,
  };
  transactions.push(transaction);
  return { status: 'created', transaction: clone(transaction) };
}

function updateTransaction(userId, id, data) {
  const transaction = findOwned(transactions, userId, id);
  if (!transaction) return { status: 'not_found' };

  const nextData = { ...transaction, ...data };
  const references = validateTransactionReferences(userId, nextData);
  if (!references.ok) return { status: references.reason };

  Object.assign(transaction, data, { updatedAt: timestamp() });
  return { status: 'updated', transaction: clone(transaction) };
}

function deleteTransaction(userId, id) {
  const transaction = findOwned(transactions, userId, id);
  if (!transaction) return { status: 'not_found' };
  transactions = transactions.filter((record) => record !== transaction);
  return { status: 'deleted' };
}

function reset() {
  nextAccountId = 1;
  nextCategoryId = 1;
  nextTransactionId = 1;
  accounts = [];
  categories = [];
  transactions = [];
}

module.exports = {
  accountTypes,
  categoryTypes,
  reset,
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
