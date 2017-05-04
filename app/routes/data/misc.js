// misc.js
// added comment - change for 2nd branch
var winston = require('winston');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Misc.js');

    var Employees = db.models.Employee;
    var Roles = db.models.Role;
    var Reviews = db.models.Reviews;

    var reviewStartedSate =  config.reviewStartedSate;
    var reviewCompletedSate = config.reviewCompletedSate;
    var reviewFinalizedSate = config.reviewFinalizedSate;

    logger.add(winston.transports.File, {
            name: 'misc', filename: config.logging.filePath + 'routes.data.misc.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

     router.get('/hrReps', function (req, res) {
        try{
            logger.info('Getting Admin HR Reps Data.');
//            RolesColl.find({isHR: true}, '_id', function (err, roles) {
//                if (err) {
//                logger.error("Error getting hrReps roles: " + err);
//                res.status(500).send(config.responses.error);
//                }
//                else{
//                    logger.info('Found (%s) hrReps Roles. ', roles.length);
//                    if (roles.length <= 0){
//                        res.status(404).send(config.responses.dataError);
//                    }
//                    else{
//                        //logger.info('Exact hrReps Roles: %s. ', roles);
//                        var cleanRoles = [];
//                        for (var roleIndex in roles) {
//                          cleanRoles.push(roles[roleIndex]._id)
//                        }
                        //logger.info('Exact Supervisor hrReps Roles: %s. ', cleanRoles);
//                        EmployeesColl.find({role: { $in: cleanRoles}}, function (err, hrReps) {
            Employees.find({isHR: true}, function (err, hrReps) {
                if (err) {
                    logger.error("Error getting hrReps: " + err);
                    res.status(500).send(config.responses.error);
                }
                else{
                    logger.info('Found (%s) hrReps. ', hrReps.length);
                    if (hrReps.length <= 0){
                        //res.status(404).send(config.responses.dataError);
                        res.send({results: []})
                    }
                    else{
                        res.send({results: hrReps});
                    }
                }
            });
//                    }
//                }
//            });
        }
        catch (hrRepsEx){
            logger.error("/hrReps - hrRepsEx: " + hrRepsEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.get('/supervisors', function (req, res) {
        try{
             logger.info('Getting Admin Supervisors Data.');
             Roles.find({hasReports: true}, '_id', function (err, roles) {
                 if (err) {
                 logger.error("Error getting supervisor roles: " + err);
                 res.status(500).send(config.responses.error);
                 }
                 else{
                     logger.info('Found (%s) Supervisor Roles. ', roles.length);
//                     console.log(roles)
                     if (roles.length <= 0){
                         res.status(404).send(config.responses.dataError);
                     }
                     else{
 //                        logger.info('Exact Supervisor Roles: %s. ', roles);
                         var cleanRoles = [];
                         for (var roleIndex in roles) {
                           cleanRoles.push(roles[roleIndex]._id)
                         }
 //                        logger.info('Exact Supervisor Clean Roles: %s. ', cleanRoles);
//                         EmployeesColl.find({role: { $in: cleanRoles}}, function (err, supervisors) {
                         Employees.find({hasReports: true}, function (err, supervisors) {
                             if (err) {
                                 logger.error("Error getting roles: " + err);
                                 res.status(500).send(config.responses.error);
                             }
                             else{
                                 logger.info('Found (%s) Supervisors. ', supervisors.length);
                                 if (supervisors.length <= 0){
 //                                    res.status(404).send(config.responses.dataError);
                                     res.send({results: []});
                                 }
                                 else{
                                     res.send({results: supervisors});
                                 }
                             }
                         });
                     }
                 }
             });
         }
         catch (supervisorsEx){
             logger.error("/supervisors - supervisorsEx: " + supervisorsEx);
             res.status(500).send(config.responses.serverError);
         }
    });

    router.get('/employeeReviews/:empId', function (req, res) {
        try{
//            var reviewEmployeeId = req.query.empId
            var reviewEmployeeId = req.params.empId
            logger.info("Getting employee's reviews Employee-Id: (%s).", reviewEmployeeId);
            // Get Reviews
            Reviews.find({reviewEmployeeId: reviewEmployeeId, state: reviewFinalizedSate}, function (err, employeeReviews) {
                if (err || !employeeReviews) {
                    logger.error("Error getting employee's reviews: " + err);
                    res.status(404).send(config.responses.error);
                }
                else{
                    logger.info('Found Employee Reviews: (%s) for Employee-Id: %s.', employeeReviews.length, reviewEmployeeId);
//                    if (employeeReviews.length<=0) {
//                        res.status(404).send(config.responses.error);
//                    }
//                    else{
                        res.send({results: employeeReviews});
//                    }
                }
            });
        }
        catch (employeeReviewsEx){
            logger.error("/employeeReviews - employeeReviewsEx: " + employeeReviewsEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    return router;
};
