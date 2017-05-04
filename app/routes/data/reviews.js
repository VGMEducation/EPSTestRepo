// reviews.js
var async = require('async');
var winston = require('winston');
var nodemailer = require('nodemailer');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Reviews.js');

    var AdminAccounts = db.models.AdminAccount;
    var Employees = db.models.Employee;
    var Reviews = db.models.Reviews;
    var Roles = db.models.Role;
    var Settings = db.models.Setting;

    var reviewStartedSate =  config.reviewStartedSate;
    var reviewCompletedSate = config.reviewCompletedSate;
    var reviewFinalizedSate = config.reviewFinalizedSate;

    var incompleteStates = [reviewStartedSate, reviewCompletedSate]; //Finalized - All signatures complete.

    var rulesSettingsQuery = { settingName: "rules"};
    var adminAccountsQuery = { settingName: "adminAccounts"};

    var defaultPassword = config.defaults.defaultPassword;
    var defaultOriginEmail = config.defaults.defaultOriginEmail;
    var defaultDestinationSalaryEmails = config.defaults.defaultDestinationSalaryEmails;

    var defaultOutboundEmailUser = config.defaults.defaultOutboundEmailUser;
    var defaultOutboundEmailPassword = config.defaults.defaultOutboundEmailPassword;

    logger.add(winston.transports.File, {
            name: 'reviews', filename: config.logging.filePath + 'routes.data.reviews.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    var smtpConfig = 'smtps://' +  config.defaults.smtpUser  + ':' + config.defaults.smtpPass + '@' + config.defaults.smtpHost;
    var transporter = nodemailer.createTransport(smtpConfig);

    transporter.verify(function(error, success) {
       if (error) {
            logger.error('Email Server Connection Error: (%s).', error);
//            console.log(error);
       } else {
            logger.info('Email Server Connection Established');
       }
    });

    var getLocationAdminEmails = function(locationId, callback){
        console.log("getLocationAdminEmails for Location-Id: (%s).", locationId);
        AdminAccounts.findOne(adminAccountsQuery, function (err, theAdminAccounts) {
            if (err || !theAdminAccounts) {
                logger.error("getLocationAdminEmails for Location-Id: (%s) & Error: (%s).", locationId, err);
                callback(null, []);
            }
            else{
                var facilityAdminLocations = [];
                theAdminAccounts.facilityAdmins.forEach(function(facAdminLoc) {
                    if (facAdminLoc.locationId==locationId){
                        facilityAdminLocations.push(facAdminLoc.email);
                    }
                });
                logger.info("getLocationAdminEmails - count (%s).", facilityAdminLocations);
                callback(null, facilityAdminLocations);
            }
        });
    };

    router.post('/review', function (req, res) {
        try{
            var reviewEmployeeId = req.body.reviewEmployeeId;
            var getRoleId = req.body.roleId;

            logger.info('Getting Review Data or Creating a New One. ReviewEmployeeId: (%s). RoleId: (%s).', reviewEmployeeId, getRoleId);
//            var incompleteStates = [reviewStartedSate, reviewCompletedSate]; //Finalized - All signatures complete.

//            console.log(req.body);
//            logger.debug('Getting Review Data or Creating a New One. payload = (%s) ', JSON.stringify(req.body));
            Reviews.findOne({reviewEmployeeId: reviewEmployeeId, state: { $in: incompleteStates}}, function (err, employeeCurrentReview) {
                if (err) {
                    logger.error("Error getting/creating employee's reviews: " + err);
                    res.status(500).send(config.responses.error);
                }
                else{
                    logger.info('Found Employee Reviews conditional statement: (%s). ReviewEmployeeId: (%s).', (employeeCurrentReview  !== null ), reviewEmployeeId);
                    if (employeeCurrentReview === null){
                        logger.info('Getting Review Role for Data Role-Id {norm}: (%s).', getRoleId);
                        Roles.findOne({_id: getRoleId}, function (err, aRole) {
                            if (err || !aRole) {
                                logger.error("Error Getting Review: (%s).", JSON.stringify(err));
                                logger.error("Error Getting Review aRole: (%s).", JSON.stringify(aRole));
                                res.status(500).send(config.responses.error);
                            }
                            else{
                                logger.info('Found A Role-Review (%s). ', getRoleId);
//                                logger.info('Found A Role-Review (%s). ', aRole._id);
                                Settings.findOne(rulesSettingsQuery, function (err, theSettings) {
                                    if (err) {
                                        logger.error("Error Getting (Rules) Settings: (%s).", err);
                                    }
                                    else{
                                        logger.info('Found Settings Data for POST (/review).');
//                                        logger.info('Found Settings Data for POST (/review).', JSON.stringify(theSettings));
                                        aRole = aRole.toObject();
                                        aRole.performanceHeaderText = theSettings.performanceHeaderText;
//                                        console.log("")
//                                        console.log("the settings")
                                        aRole.subsequentReview = theSettings.subsequentReview;
//                                        console.log(theSettings.subsequentReview)
                                        var newReview = {
                                            actualReviewDate: new Date().getTime(),
                                            lastReviewDate: new Date().getTime(),
                                            nextReviewDate: new Date().getTime(),
                                            education: "",
                                            email: "",
                                            employeeName: "",
                                            employeeReviewDate: new Date().getTime(),
                                            goals: "",
                                            growthOpportunities: "",
                                            hireDate: 0,
                                            hrRep: "",
                                            hrRepName: "",
                                            supervisor: "",
                                            supervisorName: "",
                                            location: "",
                                            locationName: "",
                                            role: "",
                                            roleName: aRole.roleName,
                                            roleId: aRole.getRoleId,
                                            overallScore: 0,
                                            salary: {},
                                            reviewEmployeeId: "",
                                            reviewQuestions: [],
                                            supervisorReviewDate: new Date().getTime(),
                                            deptHeadReviewDate: new Date().getTime(),
                                            adminReviewDate: new Date().getTime(),
                                            signatureUrl: "",
                                            state: reviewStartedSate,
                                            created_at: new Date()
                                        };
                                        newReview.reviewEmployeeId = reviewEmployeeId;
                                        newReview.currentRole = aRole;
                                        newReview.reviewQuestions = aRole.questions;
                                        Reviews.create(newReview, function callback (err, newReviewDoc) {
                                            if (err || !newReviewDoc) {
                                                logger.error("Error creating new review: (%s).", JSON.stringify(err));
                                                throw new Error('Error creating new review. ' + err);
                                            }
                                            else{
                                                var objId =newReviewDoc.id;
                                                logger.info('Created new review id (%s). ', objId);
                                                aRole.reviewId = objId;
                                                aRole.isNew = true;
                                                aRole.reviewEmployeeId = reviewEmployeeId;
                                                res.send({results: aRole});
                                            }
                                        });
                                    }
                                });
                            }
                          });
                    }
                    else{
                        employeeCurrentReview = employeeCurrentReview.toObject();
                        //console.log(employeeCurrentReview);
                        logger.info("Found Review for Employee {norm} ReviewEmployeeId: (%s).", employeeCurrentReview.reviewEmployeeId);
//                        console.log(employeeCurrentReview);
                        employeeCurrentReview.isNew = false;
                        res.send({results: employeeCurrentReview});
                    }
                }
            });
        }
        catch (reviewEx){
            logger.error("/review - reviewEx: " + reviewEx);
            res.status(500).send(config.responses.serverError);
        }
    });


    router.post('/reviews/save', function (req, res) {
        try{
            logger.info('Saving Review Data. (%s)', req.body.reviewEmployeeId);
            var reviewData = {};
            reviewData = req.body;
            var reviewId = reviewData.reviewId;
            reviewData.reviewEmployeeId = req.body.reviewEmployeeId;
            var upsertData = reviewData;
            var reviewUpdateQuery = {_id: reviewId};
            // Check States
//                logger.debug("Found Admin Accounts Data. " + reviewData.state);
//                logger.debug("------completedNotificationSent " + reviewData.completedNotificationSent);
//                logger.debug("------salaryNotificationSent " + reviewData.salaryNotificationSent);
            if (reviewData.state == reviewCompletedSate){
                // If first notice of completed email a supervisor or admin location.
                if (!reviewData.completedNotificationSent){
                    try{
                        logger.info('Sending Review Complete Message for (%s : %s) .', reviewData.employeeName, reviewData.email);
                        reviewData.completedNotificationSent = true;

                        function sendCompletedNotifications (emailToAddresses){
                            var emailSubject = "Review Ready for Admin - " + reviewData.employeeName;
                            var emailTextbody =  "User: " + reviewData.employeeName + " : most recent review is now ready for an admin review. At location " +
                                                reviewData.locationName + ". (User Email: " + reviewData.email + ')';
                            var mailOptions = {
                                from: defaultOriginEmail,
                                to: emailToAddresses,
                                subject: emailSubject,
                                text: emailTextbody
                            };

                            if (emailToAddresses.length>0){
//                                transporter.sendMail(mailOptions, function(error, info){
//                                    if(error){ logger.error('Review Complete Message Not Sent: ' + info.response);}
//                                    else{ logger.info('Review Complete Message Sent: ' + info.response);}
//                                });
                            }
                        }

                        async.waterfall([
                               async.apply(getLocationAdminEmails, reviewData.location),
                               sendCompletedNotifications
                           ]
                           , function (err, result) {
                               logger.error("/reviews/save - (async err): " + err)
                               res.status(500).send(config.responses.error);
                        });
                    }
                    catch(completedNotificationSentEx){
                        logger.info('completedNotificationSentEx: (%s).', completedNotificationSentEx);
                    }
                }
            }

            if (reviewData.state == reviewFinalizedSate){
                // If first notice of salary completed email hr.
                if (!reviewData.salaryNotificationSent){
                   try{
                        console.log("sending Salary notification ");
                        reviewData.salaryNotificationSent = true;
                        var emailSubject = "Review Ready for Admin - " + reviewData.employeeName;
                        var emailTextbody = "Salary information below is for " + reviewData.employeeName +
                                            " at location " + reviewData.locationName + ". ( " +
                                            reviewData.email + ')';
                        // TODO: Format Salary Text && Obtain Email from Client
                        emailTextbody += JSON.stringify(reviewData.salary);
                        //var emailToAddresses = [defaultOriginEmail];
                        var emailToAddresses = defaultDestinationSalaryEmails;


                        var mailOptions = {
                         from: defaultOriginEmail,
                         to: emailToAddresses,
                         subject: emailSubject,
                         text: emailTextbody,
                         //html: ''
                        };

//                            transporter.sendMail(mailOptions, function(error, info){
//                                if(error){logger.error('Error Salary Notification Message Not Sent: ' + info.response);}
//                                else{logger.info('Salary Notification Message Sent: ' + info.response);}
//                            });
                   }
                   catch(completedNotificationSentEx){
                        logger.info('completedNotificationSentEx: ' + completedNotificationSentEx);
                   }
                }

                // TODO: Update Last Review and Next Review Date
                try{
                    logger.info('Saving Admin Employee Data (Review Complete/Final).');
                    var updateEmployee = {};
                    var reviewDate = new Date().getTime();
                    updateEmployee.lastReviewDate = new Date().getTime();
                    //console.log()
                    updateEmployee.nextReviewDate = reviewDate + (reviewData.subsequentReview * 86400000);
                    var updateEmployeeId = reviewData.reviewEmployeeId;
                    console.log(updateEmployeeId + "  updateEmployee.subsequentReview " + reviewData.subsequentReview);
                    logger.info('Update Employee Data: %s', JSON.stringify(updateEmployee));
                    Employees.update({_id: updateEmployeeId}, updateEmployee, { multi: true }, function callback (err, docResults) {
                        if (err) {
                           logger.error("Error Updating Employee: " + err);
                           //res.status(404).send(config.responses.dataError);
                        }
                        else{
                           logger.info('Employee Updated. (%s) %s', updateEmployeeId, JSON.stringify(docResults));
                           //res.send({results: true});
                        }
                    });
                }
                catch (employeesSaveEx){
                    logger.error("/employees/save - employeesSaveEx: " + employeesSaveEx);
                    //res.status(500).send(config.responses.serverError);
                }
            }



            // Added December 2016 - Ensure user doesn't start two reviews by opening another tab per VGM/CES request.
//            var reviewEmployeeId = reviewData.reviewEmployeeId;
//            logger.info('Checking for Duplicate Review State: (%s). Review EmployeeId: (%s).', reviewData.state, reviewEmployeeId);
//            console.log()
//            console.log(reviewData.state)
//            console.log(reviewData._id)
//            console.log(reviewId)
//            console.log()
//            if (reviewData.state ==  reviewStartedSate){
//                Reviews.findOne({reviewEmployeeId: reviewEmployeeId, state: { $in: incompleteStates}}, function (err, employeeCurrentReview) {
//                    if (err) {
//                        logger.error("Error checking for duplicate review start: " + err);
//                        res.status(500).send(config.responses.error);
//                    }
//                    else{
//                        logger.info('Results for Checking for Duplicate Review Start: (%s). Review EmployeeId: (%s).', (employeeCurrentReview  === null ), reviewEmployeeId);
//                        if (employeeCurrentReview === null){
//                            Reviews.update(reviewUpdateQuery, upsertData, {upsert: true}, function callback (err, updatedReviewDoc) {
//                                if (err) {
//                                    logger.error("Error Saving review: " + err);
//                                    throw new Error('Error Saving review. ' + err);
//                                }
//                                else{
//                                    logger.debug('Saved review. ' + JSON.stringify(updatedReviewDoc));
//                                    logger.info('Saved review. ' + JSON.stringify(reviewUpdateQuery));
//                                    res.send({results: updatedReviewDoc});
//                                }
//                            });
//                        }
//                        else{
//                            logger.warn("/review/save - reviewsSaveEx: (Duplicate Review Error).");
//                            res.status(500).send(config.responses.duplicateError );
//                        }
//                    }
//                });
//            }
//            else{
                Reviews.update(reviewUpdateQuery, upsertData, {upsert: true}, function callback (err, updatedReviewDoc) {
                    if (err) {
                        logger.error("Error Saving review: " + err);
                        throw new Error('Error Saving review. ' + err);
                    }
                    else{
                        logger.debug('Saved review. ' + JSON.stringify(updatedReviewDoc));
                        logger.info('Saved review. ' + JSON.stringify(reviewUpdateQuery));
                        res.send({results: updatedReviewDoc});
                    }
                });
//            }

        }
        catch (reviewsSaveEx){
            logger.error("/review/save - reviewsSaveEx 1: " + reviewsSaveEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.post('/reviews/reset', function (req, res) {
        try{
            logger.info('Resetting Review Data for Review-Id: (%s).', req.body.reviewId);
//            console.log(req.body)
            var deleteReviewId = req.body.reviewId;
            var reviewEmployeeId = req.body.reviewEmployeeId;
            var getRoleId = '';
            if (deleteReviewId == 'undefined' || typeof deleteReviewId == 'undefined'){
                logger.error("Error could not find data for undefined review id: " + deleteReviewId);
                res.status(404).send(config.responses.dataError);
            }
            else{
                Reviews.findByIdAndRemove(deleteReviewId, function(err) {
                    if (!err) {
    //                    res.redirect("/reviews");
    //                    res.send({results: true});
                        logger.info('Resetting Review Data Initial Delete Complete for Review-Id: (%s) && Employee: (%s).', deleteReviewId, reviewEmployeeId);
                        // TODO: http redirect to http create/
                        var employeeInfoFilter = '';
                        Employees.findOne({_id: reviewEmployeeId}, employeeInfoFilter, function (err, anEmployee) {
                            if (err) {
                                logger.error("Error getting/creating employee's reviews: " + err);
                                res.status(500).send(config.responses.error);
                            }
                            else {
                                getRoleId = anEmployee.role;
                                logger.info('Resetting Review Data Step 2. ReviewEmployeeId: (%s). Role-Id: (%s).', reviewEmployeeId, getRoleId);
//                                var incompleteStates = [reviewStartedSate, reviewCompletedSate]; //Finalized - All signatures complete.

                    //            console.log(req.body);
                    //            logger.debug('Getting Review Data or Creating a New One. payload = (%s) ', JSON.stringify(req.body));
    //                            Reviews.findOne({reviewEmployeeId: reviewEmployeeId, state: { $in: incompleteStates}}, function (err, employeeCurrentReview) {
    //                                if (err) {
    //                                    logger.error("Error getting/creating employee's reviews: " + err);
    //                                    res.status(500).send(config.responses.error);
    //                                }
    //                                else{
    //                                    logger.info('Found An Existing Employee Review: (%s).', reviewEmployeeId);
    //                                    logger.info('Found Employee Reviews conditional statement: (%s).', (employeeCurrentReview  === null ));
    //                                    if (employeeCurrentReview === null){
                                            logger.info('Getting Review Role for Data Role-Id {reset}: (%s).', getRoleId);
                                            Roles.findOne({_id: getRoleId}, function (err, aRole) {
                                                if (err || !aRole) {
                                                    logger.error("Error Getting Review: (%s).", JSON.stringify(err));
                                                    logger.error("Error Getting Review aRole: (%s).", JSON.stringify(aRole));
                                                    res.status(500).send(config.responses.error);
                                                }
                                                else{
                                                    logger.info('Found A Role-Review (%s). ', aRole._id.toString());
                                                    Settings.findOne(rulesSettingsQuery, function (err, theSettings) {
                                                        if (err) {
                                                            logger.error("Error Getting (Rules) Settings: (%s).", err);
                                                        }
                                                        else{
    //                                                        logger.info('Found Settings Data for POST (/review).', JSON.stringify(theSettings))
                                                            logger.info('Found Settings Data for POST {reset} (/review).')
                                                            aRole = aRole.toObject();
                                                            aRole.performanceHeaderText = theSettings.performanceHeaderText;
                                                            aRole.subsequentReview = theSettings.subsequentReview;
                                                            var newReview = {
                                                                actualReviewDate: new Date().getTime(),
                                                                lastReviewDate: new Date().getTime(),
                                                                nextReviewDate: new Date().getTime(),
                                                                education: "",
                                                                email: "",
                                                                employeeName: "",
                                                                employeeReviewDate: new Date().getTime(),
                                                                goals: "",
                                                                growthOpportunities: "",
                                                                hireDate: 0,
                                                                hrRep: "",
                                                                hrRepName: "",
                                                                supervisor: "",
                                                                supervisorName: "",
                                                                location: "",
                                                                locationName: "",
                                                                role: "",
                                                                roleName: aRole.roleName,
                                                                roleId: getRoleId,
                                                                overallScore: 0,
                                                                salary: {},
                                                                reviewEmployeeId: "",
                                                                reviewQuestions: [],
                                                                supervisorReviewDate: new Date().getTime(),
                                                                deptHeadReviewDate: new Date().getTime(),
                                                                adminReviewDate: new Date().getTime(),
                                                                signatureUrl: "",
                                                                state: reviewStartedSate,
                                                                created_at: new Date()
                                                            };
                                                            newReview.reviewEmployeeId = reviewEmployeeId;
                                                            newReview.currentRole = aRole;
                                                            newReview.reviewQuestions = aRole.questions;
                                                            Reviews.create(newReview, function callback (err, newReviewDoc) {
                                                                if (err) {
                                                                    logger.error("Error creating new review: " + err);
                                                                    throw new Error('Error creating new review. ' + err);
                                                                }
                                                                else{
                                                                    //console.log(newReviewDoc);
                                                                    var objId =newReviewDoc.id;
                                                                    logger.info('Created new review id (%s). ', objId);
                                                                    //logger.info('Created aRole.subsequentReview (%s). ', aRole.subsequentReview );
                                                                    aRole.reviewId = objId;
                                                                    aRole.isNew = true;
                                                                    aRole.reviewEmployeeId = reviewEmployeeId;
                                                                    res.send({results: aRole});
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
    //                                    }
    //                                    else{
    //                                        employeeCurrentReview = employeeCurrentReview.toObject();
    //                                        //console.log(employeeCurrentReview);
    //                                        logger.info("Found Review for Employee {reset} ReviewEmployeeId: (%s). ReviewId: (%s).", employeeCurrentReview.reviewEmployeeId, employeeCurrentReview.id);
    //                                        logger.error("|This should not ever happen.| Found Review for Employee {reset} ReviewEmployeeId: (%s). ReviewId: (%s).", employeeCurrentReview.reviewEmployeeId, employeeCurrentReview.reviewId);
    //                                        employeeCurrentReview.isNew = false;
    //                                        res.send({results: employeeCurrentReview});
    //                                    }
                                    }
                                });
    //                        }
    //                    });
                    }
                    else {
                        logger.info('Failed Resetting Review Data for Review-Id: (%s). Could not find review with that id.', req.body.reviewId);
                        res.status(500).send(config.responses.serverError);
                    }

                });
            }
        }
        catch (reviewsResetEx){
            logger.error("/reviews/reset - reviewsResetEx: " + reviewsResetEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    return router;
};
