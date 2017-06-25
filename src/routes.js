/**
 * Main application routes
 */

'use strict';

export default function(app) {
	app.use('/', require('./app/main'));

	// All undefined asset or api routes should return a 404
	app.use(function(req, res){
		res.status(404).send('404 - Not found');
	});
};
