// roles.js
var winston = require('winston');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Roles.js');

    var Roles = db.models.Role;
    var Employees = db.models.Employee;

    logger.add(winston.transports.File, {
            name: 'roles', filename: config.logging.filePath + 'routes.data.roles.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    router.get('/roles', function (req, res) {
        try{
            logger.info('Getting Admin Roles Data.');
            Roles.find({ softDelete: { $ne: true } }, function (err, roles) {
                if (err || !roles) {
                    logger.error("Error getting roles: " + err);
                    res.status(500).send(config.responses.error);
                }
                else{
                    logger.info('Found (%s) Roles. ', roles.length);
                    if (roles.length <= 0){
                        res.status(404).send(config.responses.dataError);
                    }
                    else{
                        res.send({results: roles});
                    }
                }
            });
        }
        catch (rolesEx){
            logger.error("/roles - rolesEx: " + rolesEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.post('/roles/save', function (req, res) {
        try{
            logger.info('Saving Roles Data. ');
            var updateRole = {};
            updateRole.roleName = req.body.roleName;
            updateRole.active = req.body.active;
            updateRole.hasReports = req.body.hasReports;
            updateRole.isHR = req.body.isHR;
            updateRole.hasCoreComponentsQuestion = req.body.hasCoreComponentsQuestion;
            var updateRoleId = req.body._id;
            Roles.update({_id: updateRoleId}, updateRole, { multi: true }, function callback (err, docResults) {
                if (err) {
                    logger.error("Error Updating Role: " + err);
                    res.status(404).send(config.responses.dataError);
                }
                else{
                    logger.info('Role Updated for Role Name (%s) ', updateRole.roleName);
                    res.send({results: true});
                }
            });
        }
        catch (rolesSaveEx){
            logger.error("/roles/save - rolesSaveEx: " + rolesSaveEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.post('/roles/new', function (req, res) {
        try{
            logger.info('Creating a new Admin Role.');
            var newRole= {};
            newRole.active = true;
            newRole.roleName = req.body.roleName;
            newRole.hasReports = req.body.hasReports;
            newRole.isHR = req.body.isHR;
            newRole.hasCoreComponentsQuestion = req.body.hasCoreComponentsQuestion;
            //console.log(newRole)
            Roles.find({ roleName: newRole.roleName}, function (err, roles) {
                if (err) {
                logger.error("Error creating new role: " + err);
                throw new Error('Error validating unique role. ' + err);
                }
                else{
                    logger.info('(%s) Role Data Role Name (%s) ', roles.length, newRole.roleName);
                    if (roles.length >= 1){
                        res.status(403).send({error: "Roles must have unique names."});
                    }
                    else{
                        Roles.create(newRole, function callback (err, aNewRole) {
                            if (err) {
                                logger.error("Error creating new role: " + err);
                                throw new Error('Error creating new role. ' + err);
                            }
                            else{
                                logger.info('Created new Role-Name: (%s),', newRole.roleName);
                                aNewRole = aNewRole.toObject();
                                newRole._id = aNewRole._id;
                                res.send({results:newRole});
                            }
                        });
                    }
                }
            });
        }
        catch (rolesEx){
            logger.error("/roles/new - rolesEx: " + rolesEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.post('/roles/new', function (req, res) {
        try{
            logger.info('Creating a new Admin Role.');
            var newRole= {};
            newRole.active = true;
            newRole.roleName = req.body.roleName;
            newRole.hasReports = req.body.hasReports;
            newRole.isHR = req.body.isHR;
            newRole.hasCoreComponentsQuestion = req.body.hasCoreComponentsQuestion;
            //console.log(newRole)
            Roles.find({ roleName: newRole.roleName}, function (err, roles) {
                if (err) {
                logger.error("Error creating new role: " + err);
                throw new Error('Error validating unique role. ' + err);
                }
                else{
                    logger.info('(%s) Role Data Role Name (%s) ', roles.length, newRole.roleName);
                    if (roles.length >= 1){
                        res.status(403).send({error: "Roles must have unique names."});
                    }
                    else{
                        Roles.create(newRole, function callback (err, aNewRole) {
                            if (err) {
                                logger.error("Error creating new role: " + err);
                                throw new Error('Error creating new role. ' + err);
                            }
                            else{
                                logger.info('Created new Role-Name: (%s),', newRole.roleName);
                                aNewRole = aNewRole.toObject();
                                newRole._id = aNewRole._id;
                                res.send({results:newRole});
                            }
                        });
                    }
                }
            });
        }
        catch (rolesEx){
            logger.error("/roles/new - rolesEx: " + rolesEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.delete('/roles/delete/:roleId', function (req, res) {
        try{
//            var deleteRoleId = req.body._id;
            var deleteRoleId = req.params.roleId;
            logger.info('Deleting an Admin Role. Checking Existing Employees. Id: (%s).', deleteRoleId);
            Employees.find({role: deleteRoleId}, function (err, employeesWithRole) {
                if (err) {
                    logger.error("Error deleting role: " + err);
                    throw new Error('Error deleting role. ' + err);
                }
                else{
                    logger.info('(%s) Employees With Role (%s) ', employeesWithRole.length, deleteRoleId);
                    if (employeesWithRole.length>0){
                        res.status(409).send(config.responses.conflictError);
                    }
                    else if (employeesWithRole){
                        res.status(409).send(config.responses.conflictError);
                    }
                    else{
                        try{
                            logger.info('Removing Admin Role (%s). Checking Existing Employees.', deleteRoleId);
                            Roles.remove({ _id: deleteRoleId}, function callback (err) {
                                if (err) {
                                    logger.error("Error Deleting Role-Id: (%s). Error: (%s).", deleteRoleId, err);
                                    res.status(400).send(config.responses.dataError);
                                }
                                else{
                                    logger.info('Deleted Role Id (%s).', deleteRoleId);
                                    res.send({results: true});
                                }
                            });
                        }
                        catch (rolesDeleteEx){
                            logger.error("/roles/delete - rolesDeleteEx: " + rolesDeleteEx);
                            res.status(500).send(config.responses.serverError);
                        }
                    }
                }
            });
        }
        catch (deleteEx){
            logger.error("/roles/delete - deleteEx: " + deleteEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    return router;
};
