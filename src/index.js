const { start } = require('./server');

const port = process.env.PORT || 3000;
start(port).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

