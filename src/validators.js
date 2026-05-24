const { z } = require('zod');

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

function formatZodError(err) {
  return err.issues.map((i) => ({ path: i.path.join('.'), message: i.message, code: i.code }));
}

function validate(schema) {
  return (req, res, next) => {
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: formatZodError(parse.error),
        },
      });
    }
    req.validated = parse.data;
    next();
  };
}

module.exports = {
  signupSchema,
  loginSchema,
  userUpdateSchema,
  validate,
};
