var winston = require('winston');
var async= require('async');

module.exports = function(config, db, logger, router, aws) {
    logger.info('EmployeeInfo.js');

    var AdminAccount = db.models.AdminAccount;
    var EmployeeInfo = db.models.EmployeeInfo;
    var Reviews = db.models.Reviews;

    var adminAccountsQuery = { settingName: "adminAccounts"};

    var reviewStartedSate =  config.reviewStartedSate;
    var reviewCompletedSate = config.reviewCompletedSate;
    var reviewFinalizedSate = config.reviewFinalizedSate;

    logger.add(winston.transports.File, {
            name: 'employeeInfo', filename: config.logging.filePath + 'routes.data.employeeInfo.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    var getAdminAccountInfo = function(employeeId, callback){
        logger.info("getAdminAccountInfo - employeeId: (%s).", employeeId);
        EmployeeInfo.findOne({uid: employeeId}, function (err, employeeDoc) {
            var userId = employeeDoc._id;
            AdminAccount.findOne(adminAccountsQuery, function (err, theAdminAccounts) {
                if (err || !employeeDoc) {
                    logger.error("getAdminAccountInfo - Error: (%s).", err);
                    callback(null, {isCorpAdmin: false, facilityAdminLocations: [], currentEmployeeId: ""});
                }
                else{
                    logger.info("getAdminAccountInfo - Found Admin Account for employeeId: (%s).", employeeId);
                    var isCorpAdmin = false;
                    var isPayroll = false;
                    theAdminAccounts.corporateAdmins.forEach(function(corpAdmin) {
                        if (corpAdmin._id == userId){
                            isCorpAdmin = true;
                            logger.info("getAdminAccountInfo - isCorpAdmin: (%s).", isCorpAdmin);
                        }
                    });
                    var facilityAdminLocations = [];
                    theAdminAccounts.facilityAdmins.forEach(function(facAdminLoc) {
                        if (facAdminLoc._id == userId){
                            facilityAdminLocations.push(facAdminLoc.locationId.toString());
                            if (facAdminLoc.hasOwnProperty('isPayroll')){
                                if (facAdminLoc.isPayroll){
                                    isPayroll = true;
                                    logger.debug("getAdminAccountInfo - isPayroll: (%s).", isPayroll);
                                }
                            }
                        }
                    });
                    logger.info("getAdminAccountInfo ", JSON.stringify({isCorpAdmin: isCorpAdmin, facilityAdminLocations: facilityAdminLocations}));
                    callback(null, {isCorpAdmin: isCorpAdmin, facilityAdminLocations: facilityAdminLocations, currentEmployeeId: userId, isPayroll: isPayroll});
                }
            });
        });
    };

    router.get('/employeeInfo', function (req, res) {
        try{
            logger.info('Getting Employee Info Data (%s).', req.headers.uid);

            if (req.headers.uid === null || (typeof req.headers.uid === 'undefined')){
                logger.warn("Warning User Info Not Present. Fix = Login Again.");
                res.status(500).send(config.responses.errorUnauthorized);
            }
            else {
                function getEmployeeInfo(adminAccountInfo) {
                    var employeeId = req.headers.uid;
                    EmployeeInfo.findOne({uid: employeeId}, function (err, employeeInfoDoc) {
                        if (err || !employeeInfoDoc) {
                            logger.error("Error getting employee info: " + err);
                            res.status(500).send(config.responses.error);
                        }
                        else{
                            logger.info('Found EmployeeInfo: (%s) ', employeeId);
                            if (!employeeInfoDoc){
                                res.status(404).send(config.responses.dataError);
                            }
                            else{
                                logger.info('Found Employee Info Data.');
                                // Get Employees
                                EmployeeInfo.find({supervisor: employeeInfoDoc._id, active: true}, function (err, employeeReports) {
                                    if (err) {
                                        logger.error("Error getting employee's reports: " + err);
                                        res.status(500).send(config.responses.error);
                                    }
                                    else{
                                        logger.info('Found Employee Reports: (%s) ', employeeReports.length);
                                        if (employeeReports.length > 0){
                                            //logger.info("Success getting employee's reports: " + employeeReports);
                                            employeeInfoDoc.myEmployees = employeeReports;
                                        }
                                        var reviewEmployeeId = employeeInfoDoc._id;
                                        // Get Reviews
                                        Reviews.find({reviewEmployeeId: reviewEmployeeId, state: reviewFinalizedSate}, function (err, employeeReviews) {
                                            if (err) {
                                                logger.error("Error getting employee's reviews: " + err);
                                                res.status(500).send(config.responses.error);
                                            }
                                            else{
                                                logger.info('Found Employee Reviews: (%s) ', employeeReviews.length);
                                                if (employeeReviews.length > 0){
                                                    //logger.info("Success getting employee's reviews: " + JSON.stringify(employeeReviews));
                                                    employeeInfoDoc.myReviews = employeeReviews;
                                                }
                                            }
                                            // set corporate admin status
                                            employeeInfoDoc = employeeInfoDoc.toObject();
    //                                        console.log(employeeInfoDoc)
                                            employeeInfoDoc.isCorporateAdmin = adminAccountInfo.isCorpAdmin;
                                            res.send({results: employeeInfoDoc});
                                        });

                                    }
                                });

                            }
                        }
                    });
                }

                async.waterfall([
                        async.apply(getAdminAccountInfo, req.headers.uid),
                        getEmployeeInfo
                    ]
                    , function (err, result) {
                        logger.error("/employeeInfo - (async err): (%s).", err)
                        res.status(500).send(config.responses.error);
                    }
                );
            }
        }
        catch (employeeInfoEx){
            logger.error("/employeeInfo - employeeInfoEx: (%s).", employeeInfoEx);
            res.status(500).send(config.responses.serverError);
        }
    });


    return router;
};
