import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, pino.destination(path.join(logDir, 'server.log')));

export default logger;
