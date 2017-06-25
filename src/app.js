/**
 * Main application file
 */

'use strict';

import http from 'http';
import express from 'express';
import { environment } from './config/environment';
import expressConfig from './config/express';
import routes from './routes';

const app = express();
const server = http.Server(app);

expressConfig(app);
routes(app);

process.on('uncaughtException', function (err) {
	console.error(err);
	process.exit(0);
});

server.listen(environment.port);

console.log(`App listen port ${environment.port}`);


