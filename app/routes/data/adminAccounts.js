var winston = require('winston');
var async= require('async');

module.exports = function(config, db, logger, router, aws) {
    logger.info('AdminAccounts.js');

    var AdminAccounts = db.models.AdminAccount;
    var Employees = db.models.Employee;
    var Locations = db.models.Location;

    var adminAccountsQuery = { settingName: "adminAccounts"};

    logger.add(winston.transports.File, {
            name: 'adminAccounts', filename: config.logging.filePath + 'routes.data.adminAccounts.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    router.get('/adminAccounts', function (req, res) {
        try{
            logger.info('Getting Admin Accounts Data.'); //TODO:  Limit UID's That have Access
            var adminAccountsFilter = 'employees locations';
            AdminAccounts.findOne(adminAccountsQuery, function (err, theAdminAccounts) {
                if (err) {
                    logger.error("Getting Admin Accounts - Error: (%s).", err);
                    res.status(404).send(config.responses.dataError);
                }
                else{
                    var adminAccounts = theAdminAccounts;
                    //var adminAccounts = theAdminAccounts[0];
                    logger.info('Getting Admin Accounts - Found Admin Accounts Data.')
//                    logger.debug('Found Admin Accounts Data. ' + JSON.stringify(adminAccounts));
                    Locations.find({}, function (err, locations) {
                        if (err) {
                            logger.error("Getting Admin Accounts - Error getting locations: (%s)." , err);
                            res.status(404).send(config.responses.dataError);
                        }
                        else{
                            logger.info('Getting Admin Accounts - Found (%s) Locations.', locations.length);
                            Employees.find({}, function (err, employees) {
                                if (err) {
                                    logger.error("Getting Admin Accounts - Error getting employees: (%s).", err);
                                    res.status(500).send(config.responses.error);
                                }
                                else{
                                    logger.info('Getting Admin Accounts - Found (%s) Employees.', employees.length);
                                    adminAccounts = adminAccounts.toObject();
                                    adminAccounts.employees = employees;
                                    adminAccounts.locations = locations;
                                    res.send({results: adminAccounts});
                                }
                            });
                        }
                    });
                }
            });
        }
        catch (adminAccountsEx){
            logger.error("/adminAccounts - adminAccountsEx: " + adminAccountsEx)
            res.status(500).send(config.responses.error);
        }
    });

    router.post('/adminAccounts/save', function (req, res) {
        try{
            logger.info('Saving Admin Accounts Data.');
            var newAdminAccounts = req.body.newAdminIds;
            var removedAdminAccount= req.body.removedAdminIds;
//            console.log(newAdminAccounts)
//            console.log(removedAdminAccount)
            var upsertData = {
                corporateAdmins: req.body.corporateAdmins,
                facilityAdmins: req.body.facilityAdmins
            };

            AdminAccounts.update(adminAccountsQuery, upsertData, {upsert: true}, function callback (err, updatedAdminAccountDoc) {
                if (err) {
                    logger.error("Saving Admin Accounts - Error saving adminAccounts: (%s).", err);
                    res.status(404).send(config.responses.dataError);
                }
                else{
                    // Update Admin Fields for Users
                    if (newAdminAccounts.length>0){
                        var newAdminQuery = {_id: { $in: newAdminAccounts}};
                        Employees.update(newAdminQuery, { isAdmin: true }, function (err, locations) {
                            if (err) {
                                logger.error("Saving Admin Accounts - Error Updating newAdminAccounts: (%s).", err);
                            }
                            else{
                                logger.info('Updated newAdminAccounts.');
//                                    logger.info(JSON.stringify(newAdminQuery));
                            }
                        });
                    }
                    if (removedAdminAccount.length>0){
                        var removedAdminQuery = {_id: { $in: removedAdminAccount}};
                        Employees.update(removedAdminQuery, { isAdmin: false }, function (err, locations) {
                            if (err) {
                                logger.error("Saving Admin Accounts - Error Updating removedAdminAccount: (%s).", err);
                            }
                            else{
                                logger.info('Updated removedAdminAccount.');
//                                logger.info(JSON.stringify(removedAdminAccount));
                            }
                        });
                    }
                    logger.info('Admin Accounts Saved.');
//                    logger.info('Admin Accounts Saved.' + JSON.stringify(updatedAdminAccountDoc));
                    res.send({results: true});
                }
            });
        }
        catch (settingsSaveEx){
            logger.error("/adminAccounts/save - adminAccountsEx: " + settingsSaveEx)
            res.status(500).send(config.responses.error);
        }
    });

    return router;
};
