var express = require('express');
module.exports = function(app, config, log) {
    'use strict';
    //var router = require('express').Router();
    var router = express.Router();
	var apiPrefix = config.web.apiPrefix;

	var defaultResponseError = config.responses.error;
	var defaultResponseDataError = config.responses.dataError;
	var defaultResponseInvalidRequestError = config.responses.invalidRequestError;
	var defaultResponseInternalError = config.responses.serverError;

	// application -------------------------------------------------------------
	router.get('/*', function(req, res) {
		res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});

	return router;
	//var router = express.Router();
};
