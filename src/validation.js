const { z } = require('zod');

const emailSchema = z.string().email();

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    name: z.string().min(1).max(120).optional(),
  })
  .refine((data) => data.email !== undefined || data.name !== undefined, {
    message: 'At least one of email or name must be provided',
    path: ['email'],
  });

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path, message: i.message }));
    const err = new Error('Validation failed');
    err.status = 422;
    err.details = issues;
    throw err;
  }
  return result.data;
}

module.exports = {
  signupSchema,
  loginSchema,
  updateUserSchema,
  refreshSchema,
  parseBody,
};
