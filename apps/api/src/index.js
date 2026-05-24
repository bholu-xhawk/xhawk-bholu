import 'dotenv/config';
import { app } from './server.js';
import { ensureSchema } from './db.js';

const PORT = process.env.PORT || 4000;

ensureSchema();

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
