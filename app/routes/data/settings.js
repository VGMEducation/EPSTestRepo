    // settings.js
var winston = require('winston');

module.exports = function(config, db, logger, router, aws) {
    logger.info('Settings.js');

    var Setting = db.models.Setting;

    var adminSettingsQuery = { settingName: "rules"};

    logger.add(winston.transports.File, {
            name: 'setting', filename: config.logging.filePath + 'routes.data.settings.log',
            maxsize: config.logging.maxsize, maxFiles: config.logging.maxFiles, colorize: 'true', timestamp: true
        }
    );

    router.get('/settings', function (req, res) {
        try{
            logger.info('Getting Admin Settings Data.');
            var settingsFilter = 'initialReview subsequentReview upcomingReview performanceHeaderText coreComponentsPrefaceText lastModified';
            Setting.findOne(adminSettingsQuery, settingsFilter, function (err, rulesSettings) {
                if (err || !rulesSettings) {
                    logger.error("Error Getting Settings: (%s).", err);
                    res.status(404).send(config.responses.dataError);
                }
                else{
                    logger.info('Found Settings Data. ');
//                    logger.debug('Found Settings Data. ' + JSON.stringify(rulesSettings));;
                    res.send({ results: rulesSettings});
                }
            });
        }
        catch (settingsEx){
            logger.error("/settingsEx - settingsEx: " + settingsEx)
            res.status(500).send(config.responses.error);
        }
    });

    router.post('/settings/save', function (req, res) {
        try{
            logger.info('Saving Admin Settings Data.');
            var newSettings = {};
            newSettings.initialReview = req.body.initialReview;
            newSettings.subsequentReview = req.body.subsequentReview;
            newSettings.upcomingReview = req.body.upcomingReview;
            newSettings.performanceHeaderText = req.body.performanceHeaderText;

            Setting.update({ settingName: "rules"}, newSettings, { multi: true }, function callback (err, numAffected) {
                if (err) {
                    logger.error("Error saving settings: " + err);
                    res.status(404).send(config.responses.dataError);
                }
                else{
                    logger.info('Settings Saved.');
                    res.send({results: true});
                }
            });
        }
        catch (settingsSaveEx){
            logger.error("/settings/save - settingsSaveEx: " + settingsSaveEx)
            res.status(500).send(config.responses.error);
        }
    });

    return router;
};
