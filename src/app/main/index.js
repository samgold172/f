'use strict';

import express from 'express';
import { mainCtrl } from './main.controller';

const router = express.Router();

router.get('/', mainCtrl.get);
router.post('/', mainCtrl.calculate);

module.exports =  router;
