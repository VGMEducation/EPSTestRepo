// auth.js - handles routing necessary for auth and user management
var express = require('express');
var winston = require('winston');
var stormpath = require('stormpath');
var http = require('http');
var https = require('https');

//var nJwt = require('nJwt');

module.exports = function(config, db) {

    var EmployeeInfo = db.models.EmployeeInfo;

    //'use strict';
    winston.level = config.logging.level;
    var logger = new (winston.Logger)({
        datePattern: config.logging.datePattern,
        transports: [
          new (winston.transports.Console)({timestamp: true}),
          new (winston.transports.File)({ filename: config.logging.filePath + 'routesAuth.log', maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, timestamp: true })
        ]
    });
    var router = express.Router();

    var specialToken = config.specialToken;
    var jwtDefaultExpiration = config.jwtDefaultExpiration;
    var defaultRedirect = config.defaultRedirect;

    var apiPrefix='/api'

    var stormpathApiKey = new stormpath.ApiKey(
        config.stormpath.STORMPATH_API_KEY_ID,
        config.stormpath.STORMPATH_API_KEY_SECRET
    );

    var spClient = new stormpath.Client({ apiKey: stormpathApiKey });

    var validateUser = function(username, password) {

//        console.log("validateUser")
//        var dbUserObj = { // spoofing a userobject from the DB.
//            name: 'arvind',
//            role: 'admin',
//            username: 'arvind@myapp.com'
//        };
//
//        return dbUserObj;
    };

    router.post('/login', function (req, res) {
        try{
            var email = req.body.email || '';
            var password = req.body.password || '';
            logger.debug('Authenticate user. Email: (%s).', email);

            if (!email || !password) {
                logger.debug('Email or Password not found.');
                res.status(400).send({error: "Email and Password required."});
            }
            var stormpathApp = spClient.getApplication(config.stormpath.STORMPATH_APP_HREF, function(err, spApp) {
                if (err) {
                    logger.error("Authentication failed (Getting StormpathApp) error: " + err);
                    res.status(500).send(config.responses.error);
                }
                logger.debug("Authentication got StormpathApp successfully.");
                var returnedAccount;

                spApp.authenticateAccount({
                  username: email,
                  password: password,
                }, function (err, result) {
                    logger.debug("Authentication results: %s", JSON.stringify(result));
                    if (err) {
                        logger.error("Authentication failed: %s", JSON.stringify(err));
                        res.status(err.status).send({error: err.userMessage});
                    }
                    else{
                        logger.info('Authenticated user email: (%s).', email);
                        //var accessToken = result.getAccessToken();
                        var accessToken = result.getJwt();
                        accessToken.setExpiration(new Date().getTime() + (jwtDefaultExpiration));
                        accessToken = accessToken.compact();
                        returnedAccount = result.account;
                        //logger.debug(returnedAccount);
                        //var uid = returnedAccount.href.remove('https://api.stormpath.com/v1/accounts/');
                        var uid = returnedAccount.href.substring(38);
                        //logger.debug(uid);
                        var customAccount = {
                            username: returnedAccount.username,
                            email: returnedAccount.email,
                            givenName: returnedAccount.givenName,
                            middleName: returnedAccount.middleName,
                            surname: returnedAccount.surname,
                            fullName: returnedAccount.fullName,
                            status: returnedAccount.status,
                            createdAt: returnedAccount.createdAt,
                            modifiedAt: returnedAccount.modifiedAt,
                            jwt: accessToken,
                            uid: uid
                        };
                        EmployeeInfo.findOne({ uid: uid}, function (err, aUser) {
                            if (err || !aUser){
                                logger.error("No User Account found in DB for User-Id: (%s)", uid);
//                                res.status(500).send(config.responses.error);
                                res.status(404).send({error: "No user data found for that email."});
                            }
                            else if (customAccount.email != email){

                                logger.error("Custom Account Returned: (%s). It does not match supplied email %s.", customAccount.email, email);
                                res.status(404).send({error: "No user data found for that email."});
                            }
                            else{
                                logger.info("Custom Account Returned: (%s)", customAccount.email);
                                var userInfo = aUser.toObject();

                                customAccount.location = userInfo.location;
                                customAccount.employeeName = userInfo.employeeName;
                                customAccount.firstName = userInfo.firstName;
                                customAccount.lastName = userInfo.lastName;
                                customAccount.active = userInfo.active;
                                customAccount.text = userInfo.text;
                                customAccount.hrRep = userInfo.hrRep;
                                customAccount.isHR = userInfo.isHR;
                                customAccount.supervisor = userInfo.supervisor;
                                customAccount.role = userInfo.role;
                                customAccount.lastReviewDate = userInfo.lastReviewDate;
                                customAccount.nextReviewDate = userInfo.nextReviewDate;
                                customAccount.supervisorName = userInfo.supervisorName;
                                customAccount.locationName = userInfo.locationName;
                                customAccount.roleName = userInfo.roleName;
                                customAccount.hasReports = userInfo.hasReports;
    //                            customAccount.isAdmin = userInfo.isAdmin;
    //                            customAccount.isCustodian = userInfo.isCustodian;
    //                            customAccount.isCorporateAdmin = userInfo.isCorporateAdmin;
    //                            customAccount.isFacilityAdmin = userInfo.isFacilityAdmin;
                                customAccount.hrRepName = userInfo.hrRepName;
                                customAccount.createDate = userInfo.createDate;
                                customAccount.hireDate = userInfo.hireDate;


                                logger.info("Custom Account Returned: (%s). First: (%s). Last: (%s).", uid, customAccount.firstName, customAccount.lastName);

                                //customAccount.myReviews = userInfo.myReviews;
                                res.send({results: customAccount});
                            }
                        });
                    }
                });
            });
        }
        catch (stormpathCreateEx){
            logger.error("/login - Exception: " + stormpathCreateEx)
            res.status(500).send(config.responses.error);
        }
    });

    router.post('/forgot', function (req, res) {
        try{
            var email = req.body.email || '';
            logger.debug('Forgot Password Email: %s', email);
            var stormpathApp = spClient.getApplication(config.stormpath.STORMPATH_APP_HREF, function(err, spApp) {
                if (err) {
                    logger.error("Forgot Password failed (Getting StormpathApp) error: " + err);
                    res.status(500).send(config.responses.error);
                }
                logger.debug("Forgot Password got StormpathApp successfully.");
                spApp.sendPasswordResetEmail(email, function(err, token){
                    logger.debug("Forgot Password results: %s", token);
                    if (err) {
                        logger.error("Forgot Password failed: %s", JSON.stringify(err));
                        if (err.status == 400){
                            res.status(err.status).send({error: 'No account associated with that email.'});
                        }
                        else{
                            res.status(err.status).send({error: err.userMessage});
                        }
                    }
                    else{
                        logger.info('Forgot Password sending reset email to user email (%s)', email);
                        //logger.debug(token.href);
                        res.send({results: true});
                    }
                });
            });
        }
        catch (stormpathForgotEx){
            logger.error("/forgot - stormpathForgotEx: " + stormpathForgotEx)
            res.status(500).send(config.responses.error);
        }
    });

    router.post('/resetVerify', function (req, res) {
        try{
            var spToken = req.body.sptoken;
            logger.info('Forgot Password Verify SP-Token: %s.', spToken);
            if (!spToken) {
                logger.warn("Forgot Password Verify requires SP-Token.");
                res.status(404).send({error: "Token is no longer valid."});
            }
            else{
                var stormpathApp = spClient.getApplication(config.stormpath.STORMPATH_APP_HREF, function(err, spApp) {
                    if (err) {
                        logger.error("Forgot Password Verify failed (Getting StormpathApp) error: %s", JSON.stringify(err));
                        res.status(500).send(config.responses.error);
                    }
                    logger.debug("Forgot Password Verify got StormpathApp successfully.");
                    spApp.verifyPasswordResetToken(spToken, function(err, verificationResponse){
                        if (err) {
                            logger.error("Forgot Password Verify failed: %s", JSON.stringify(err));
                            //res.status(err.status).send({error: err.userMessage});
                            res.status(404).send({error: "Token is no longer valid."});
                        } else {
                            // Show the user a form which allows them to reset their password
                            spClient.getAccount(verificationResponse.account.href, function(err, account) {
                                logger.debug(account);
                                logger.info('Forgot Password Verify complete. User will set new password now.');
                                res.send(true);
                            });
                        }
                    });
                });
            }
        }
        catch (stormpathResetVerifyEx){
            logger.error("/resetVerify - stormpathResetVerifyEx: " + stormpathResetVerifyEx)
            res.status(500).send(config.responses.error);
        }
    });

    router.post('/reset', function (req, res) {
        try{
            var spToken = req.body.sptoken || '';
            var newPassword = req.body.password || '';
            logger.info('Reset Password SP-Token: %s.', spToken);
            if (!spToken || !newPassword) {
                logger.warn("Reset Password Verify requires SP-Token and New Password.");
                res.status(400).send({error: "Invalid request."});
            }
            var stormpathApp = spClient.getApplication(config.stormpath.STORMPATH_APP_HREF, function(err, spApp) {
                if (err) {
                    logger.error("Rest Password failed (Getting StormpathApp) error: %s", JSON.stringify(err));
                    res.status(500).send(config.responses.error);
                }
                logger.debug("Reset Password Verify got StormpathApp successfully.");
                spApp.resetPassword(spToken, newPassword, function(err, result) {
                    if (err) {
                        logger.error("Reset Password failed: %s", JSON.stringify(err));
                        //res.status(err.status).send({error: err.userMessage});
                        res.status(404).send({error: "Token is no longer valid."});
                    } else {
                        // Show the user a form which allows them to reset their password
                        logger.info('Reset Password complete for user' + result.account.href + '.');
                        res.send(true);
                    }
                });
            });
        }
        catch (stormpathResetEx){
            logger.error("/reset - stormpathResetEx: " + stormpathResetEx);
            res.status(500).send(config.responses.error);
        }
    });

    // Logout the user, then redirect to the home page.
    router.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });

    return router;
};