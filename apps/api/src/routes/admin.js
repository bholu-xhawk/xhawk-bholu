const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.use(auth);
router.use(requireRole('ADMIN'));

router.get('/admin/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { id: 'asc' },
  });
  res.json(users);
});

module.exports = router;
