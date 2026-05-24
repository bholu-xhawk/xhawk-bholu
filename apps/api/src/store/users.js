import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.resolve(__dirname, '../../data/users.json');

async function readUsers() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function atomicWriteUsers(users) {
  const dir = path.dirname(dataFile);
  const tmp = path.join(dir, `users.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`);
  const json = JSON.stringify(users, null, 2) + '\n';
  await fs.writeFile(tmp, json, 'utf8');
  await fs.rename(tmp, dataFile);
}

function sanitize(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function listUsers() {
  const users = await readUsers();
  return users.map(sanitize);
}

export async function getUserById(id) {
  const users = await readUsers();
  return sanitize(users.find(u => u.id === id));
}

export async function getUserRecordById(id) {
  const users = await readUsers();
  return users.find(u => u.id === id) || null;
}

export async function getUserByEmail(email) {
  const users = await readUsers();
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export async function createUser({ email, password, isAdmin = false }) {
  if (!email || !password) {
    const err = new Error('email and password are required');
    err.status = 400;
    throw err;
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 422;
    throw err;
  }
  const users = await readUsers();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    email: String(email).toLowerCase(),
    passwordHash,
    isAdmin: Boolean(isAdmin),
    createdAt: now,
    updatedAt: now
  };
  users.push(user);
  await atomicWriteUsers(users);
  return sanitize(user);
}

export async function updateUser(id, { email, password, isAdmin }) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  const current = users[idx];
  if (email !== undefined) {
    const normalized = String(email).toLowerCase();
    if (!normalized) {
      const err = new Error('email cannot be empty');
      err.status = 400;
      throw err;
    }
    const duplicate = users.find(u => u.email === normalized && u.id !== id);
    if (duplicate) {
      const err = new Error('Email already in use');
      err.status = 422;
      throw err;
    }
    current.email = normalized;
  }
  if (password !== undefined) {
    if (!password) {
      const err = new Error('password cannot be empty');
      err.status = 400;
      throw err;
    }
    current.passwordHash = await bcrypt.hash(password, 10);
  }
  if (isAdmin !== undefined) {
    current.isAdmin = Boolean(isAdmin);
  }
  current.updatedAt = new Date().toISOString();
  users[idx] = current;
  await atomicWriteUsers(users);
  return sanitize(current);
}

export async function deleteUser(id) {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  await atomicWriteUsers(users);
  return true;
}

export async function verifyPassword(user, password) {
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export function stripSensitive(user) {
  return sanitize(user);
}
