const app = require('./app');
const env = require('./config/env');

const HOST = '0.0.0.0';

const server = app.listen(env.port, HOST, () => {
  console.log(`AUTOS API running on ${HOST}:${env.port}`);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  server.close(() => process.exit(1));
});
