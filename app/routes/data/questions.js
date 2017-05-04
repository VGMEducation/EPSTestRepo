// questions.js
// added comment - change for 3rd branch
var winston = require('winston');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Questions.js');

    var Questions = db.models.Location;
    var Roles = db.models.Role;

    logger.add(winston.transports.File, {
            name: 'questions', filename: config.logging.filePath + 'routes.data.questions.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    router.post('/questions/save', function (req, res) {
        try{
            var roleId = req.body.roleId;
            logger.info('Saving Question Data for Role-Id: (%s).', roleId);
            var updateQuestion = {};
            var updateQuestionId = req.body._id;
            updateQuestion._id = req.body._id;
            updateQuestion.active = req.body.active;
            //updateQuestion.title = req.body.title;
            updateQuestion.title = req.body.title;
            updateQuestion.order = req.body.order;
            //updateQuestion.text = req.body.text;
            updateQuestion.text = req.body.text;
            updateQuestion.isCoreComponent = req.body.isCoreComponent;

            var questionsUpdateQuery = {_id: roleId, "questions._id": updateQuestionId};
            var questionsUpdateData = { $set: {"questions.$": updateQuestion}};

            Roles.findOneAndUpdate(questionsUpdateQuery, questionsUpdateData, function callback (err, saveRes) {
                if (err) {
                    logger.error("Error saving question: " + err);
                    res.status(500).send(config.responses.serverError);
                    //throw new Error('Error saving question. ' + err);
                }
                else{
                    logger.info("Saved question '%s' for Role-Id: (%s).", updateQuestionId, roleId);
                    if (!saveRes){
                        logger.error("No question found with id %s.", updateQuestionId);
                        res.status(404).send(config.responses.dataError);
                    }
                    else{
                        res.send({results: true});
                   }
                }
            });
        }
        catch (questionsSaveEx){
            logger.error("/questions/save - questionsSaveEx: " + questionsSaveEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    router.post('/questions/new', function (req, res) {
        try{
            var roleId = req.body.roleId;
            logger.info('Creating a new Admin Question for Role-Id: (%s).', roleId);
            var newQuestion = {};
            newQuestion.active = req.body.active;
            newQuestion.title = req.body.title;
            newQuestion.order = req.body.order;
            newQuestion.text = req.body.text;
            newQuestion.isCoreComponent = req.body.isCoreComponent;
//            logger.debug('New Question: %s', JSON.stringify(newQuestion));
            var roleQuery = {_id: roleId};
            Roles.findById(roleQuery, function (err, aRole) {
                if (err) {
                    logger.error("Error creating new question: " + err);
                    throw new Error('Error finding creating question. ' + err);
                }
                else{
                    if (typeof aRole !== 'undefined' && aRole){
                        logger.info('Role Found (%s) | %s.', roleId);
//                        logger.info('Role Found (%s) | %s.', roleId, JSON.stringify(aRole));
                        aRole.questions.push(newQuestion);
                        aRole.save(function (err, saveRes) {
                            if(err){
                                logger.error("Error creating new question: " + err);
                                throw new Error('Error saving new question. ' + err);
                            }
                            else{
                                var aNewQuestion = saveRes.questions[saveRes.questions.length -1]
                                logger.info('Created new Question-Id: (%s).', aNewQuestion._id);
                                res.send({results: aNewQuestion});
                            }
                        })

                    }
                    else{
                        logger.error("Error creating new question. No role found with id: %s", roleId);
                        res.status(404).send(config.responses.dataError);
                    }
                }
            });
        }
        catch (rolesEx){
            logger.error("/roles/new - rolesEx: " + rolesEx);
            res.status(500).send(config.responses.serverError);
        }
    });

    return router;
};
