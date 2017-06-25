'use strict';

import bodyParser from 'body-parser';
import errorhandler from 'errorhandler';
import exphbs from 'express-handlebars';
import { environment } from './environment';

export default function(app){
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(errorhandler());
	app.engine('handlebars', exphbs({
		layoutsDir: environment.root + '/views/layouts/',
		defaultLayout: 'main',
		partialsDir: [environment.root + '/views/partials/']
	}));
	app.set('views', environment.root + '/views');
	app.set('view engine', 'handlebars');
};


