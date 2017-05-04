// reports.js
var async = require('async');
var winston = require('winston');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Reports.js');

    var AdminAccount = db.models.AdminAccount;
    var EmployeeInfo = db.models.EmployeeInfo;
    var Reports = db.models.Report;

    var adminAccountsQuery = { settingName: "adminAccounts"};

    logger.add(winston.transports.File, {
            name: 'reports', filename: config.logging.filePath + 'routes.data.reports.log',
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

    router.get('/reports', function (req, res) {
        try{
            var queryStartTime = new Date();
            function getSelectReports(adminAccountInfo) {
                logger.info('Getting Admin Employees "Reports" Data.');
                var reportsQuery = {};
                var supervisorId = adminAccountInfo.currentEmployeeId;
                if (adminAccountInfo.isCorpAdmin){
                    logger.debug("isCorpAdmin - display all " + new Date());
                }
                else{
                    if (adminAccountInfo.facilityAdminLocations.length>0){
                        //console.log("is facility admin");
                        reportsQuery = {location: { $in: adminAccountInfo.facilityAdminLocations}};
                    }
                    else{
                        reportsQuery = {'supervisor': supervisorId};
                    }
                }
                logger.info("isCorpAdmin - reportsQuery (%s).", JSON.stringify(reportsQuery));
                reportsQuery.active = true;
                Reports.find(reportsQuery, function (err, reports) {
                    if (err) {
                        logger.error("Error getting reports: " + err);
                        res.status(500).send(config.responses.error);
                    }
                    else{
                        logger.info('Found (%s) Reports. ', reports.length);
                        if (reports.length <= 0 || !reports){
                            res.status(404).send(config.responses.dataError);
                        }
                        else{
                            res.send({results: reports});
                        }
                    }
                });
            }

            async.waterfall([
                    async.apply(getAdminAccountInfo, req.headers.uid),
                    getSelectReports
                ]
                , function (err, result) {
                    logger.error("/reports - reportsEx (async err): " + err)
                    res.status(500).send(config.responses.error);
            });
        }
        catch (reportsEx){
            logger.error("/reports - reportsEx: " + reportsEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    return router;
};
