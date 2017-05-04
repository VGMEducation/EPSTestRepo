// locations.js
var async = require('async');
var winston = require('winston');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Locations.js');

    var AdminAccount = db.models.AdminAccount;
    var EmployeeInfo = db.models.EmployeeInfo;
    var Location = db.models.Location;

    logger.add(winston.transports.File, {
            name: 'locations', filename: config.logging.filePath + 'routes.data.locations.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    var getAdminAccountInfo = function(employeeId, callback){
        logger.info("getAdminAccountInfo (locations) - employeeId: (%s).", employeeId);
        EmployeeInfo.findOne({uid: employeeId}, function (err, employeeDoc) {
            var userId = employeeDoc._id;
            AdminAccount.findOne({ settingName: "adminAccounts"}, function (err, theAdminAccounts) {
                if (err || !theAdminAccounts) {
                    logger.error("getAdminAccountInfo - Error: (%s).", err);
                    callback(null, {isCorpAdmin: false, facilityAdminLocations: [], currentEmployeeId: ""});
                }
                else{
                    logger.info("getAdminAccountInfo (locations) - Found Admin Account for employeeId: (%s).", employeeId);
                    var isCorpAdmin = false;
                    var isPayroll = false;
                    theAdminAccounts.corporateAdmins.forEach(function(corpAdmin) {
                        if (corpAdmin._id == userId){
                            isCorpAdmin = true;
                            logger.debug("getAdminAccountInfo (locations) - isCorpAdmin: (%s).", isCorpAdmin);
                        }
                    });
                    var facilityAdminLocations = [];
                    theAdminAccounts.facilityAdmins.forEach(function(facAdminLoc) {
                        if (facAdminLoc._id == userId){
                            facilityAdminLocations.push(facAdminLoc.locationId.toString());
                            if (facAdminLoc.hasOwnProperty('isPayroll')){
                                if (facAdminLoc.isPayroll){
                                    isPayroll = true;
                                    logger.debug("getAdminAccountInfo (locations) - isPayroll: (%s).", isPayroll);
                                }
                            }
                        }
                    });
                    logger.info("getAdminAccountInfo (locations) - ", JSON.stringify({isCorpAdmin: isCorpAdmin, facilityAdminLocations: facilityAdminLocations}));
                    callback(null, {isCorpAdmin: isCorpAdmin, facilityAdminLocations: facilityAdminLocations, currentEmployeeId: userId, isPayroll: isPayroll});
                }
            });
        });
    };

    router.get('/locations', function (req, res) {
        try{
            logger.info('Getting Admin Locations Data. uid-(%s)', req.headers.uid);
            function getSelectLocations(adminAccountInfo) {
                var locationQuery = {};
                if (adminAccountInfo.isCorpAdmin){
                    //console.log("isCorpAdmin - display all");
                }
                else{
                    locationQuery = {_id: { $in: adminAccountInfo.facilityAdminLocations}};
                }
                Location.find(locationQuery, function (err, locations) {
                    if (err  || !locations) {
                        logger.error("Error getting locations: " + err);
                        res.status(404).send(config.responses.dataError);
                    }
                    else{
                        logger.info('Found Locations Data Count (%s).', locations.length);
                        res.send({ results: locations });
                    }
                });
            }

            async.waterfall([
                    async.apply(getAdminAccountInfo, req.headers.uid),
                    getSelectLocations
                ]
                , function (err, result) {
                    logger.error("/locations - locationsEx (async err): " + err)
                    res.status(500).send(config.responses.error);
            });
        }
        catch (locationsEx){
            logger.error("/locations - locationsEx: " + locationsEx)
            res.status(500).send(config.responses.error);
        }
    });

    router.post('/locations/save', function (req, res) {
            try{
                logger.info('Saving Locations Data. ');
                var updateLocation = {};
                //updateLocation.name = req.body.name;
                updateLocation.active = req.body.active;
                var updateLocationId = req.body._id;
                Location.update({_id: updateLocationId}, updateLocation, { multi: true }, function callback (err, docResults) {
                    if (err) {
                        logger.error("Error Updating Location: " + err);
                        res.status(404).send(config.responses.dataError);
                    }
                    else{
                        logger.info('Location Updated.');
                        res.send({results: true});
                    }
                });
            }
            catch (locationsEx){
                logger.error("/locations/save - locationsEx: " + locationsEx)
                res.status(500).send(config.responses.error);
            }

    });

    router.post('/locations/new', function (req, res) {
        try{
            logger.info('Creating a New Location.');
            var newLocation = {};
            newLocation.active = req.body.active;
            newLocation.name = req.body.name;
            Location.find({ name: newLocation.name}, function (err, locations) {
                if (err) {
                    logger.error("Error creating new locations: (%s).", err);
                    throw new Error('Error validating unique location. ' + err);
                }
                else{
                    logger.info('(%s) Locations with Name (%s) ', locations.length, newLocation.name);
                    if (locations.length >= 1){
                        res.status(403).send({error: "Locations must have unique names."});
                    }
                    else{
                        Location.create(newLocation, function callback (err, newLocation) {
                            if (err) {
                                logger.error("Error creating new locations: (%s).", err);
                                throw new Error('Error creating new location. ' + err);
                            }
                            else{
                                logger.info('Created new location. (%s).',  newLocation.name);
//                                logger.info('Created new location. (%s).',  JSON.stringify(newLocation));
                                res.send({results: newLocation});
                            }
                        });
                    }
                }
            });
        }
        catch (locationsEx){
            logger.error("/locations/new - locationsEx: " + locationsEx)
            res.status(500).send(config.responses.error);
        }
    });

    return router;
};
