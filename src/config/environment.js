'use strict';

import path from 'path';

export const environment = {
	//Environment
	env: process.env.NODE_ENV,

	// Root path of server
	root: path.normalize(`${__dirname}/../..`),

	// Server port
	port: 9000
};