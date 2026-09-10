const { z } = require('zod');

const createTodoSchema = z
  .object({
    title: z.string().trim().min(1),
  })
  .strict();

const updateTodoSchema = z
  .object({
    completed: z.boolean(),
  })
  .strict();

module.exports = {
  createTodoSchema,
  updateTodoSchema,
};
