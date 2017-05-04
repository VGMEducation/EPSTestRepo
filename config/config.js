var config = {};

config.env = 'dev';
config.logging = {};
config.pusher = {};
config.stormpath = {};
config.aws = { };
config.mongo = {};
config.responses = { error: {}, serverError: {} };
config.web = {}

config.defaultRedirect = 'home';
config.jwtDefaultExpiration = 30*60*1000; // 30 Minutes

config.logging.level = 'debug';
config.logging.datePattern = '.yyyy-MM-ddTHH';
config.logging.filename = './log/mainLogging.log';
config.logging.filePath = './log/';
//config.logging.maxSize = 100000000; //bytes
config.logging.maxSize = 1048576; //bytes
config.logging.maxFiles = 3;
//config.fileName = 'mainLogging.log';


// Stormpath

// Stormpath - Prod
config.stormpath.STORMPATH_API_ID="7FDamBX3BYNmiNdabuGBPm";
config.stormpath.STORMPATH_API_KEY_ID="FCDYX52YR9896B14M83MFHCAX";
config.stormpath.STORMPATH_API_KEY_SECRET="NTDKlVBH3ZQq1lkAarV00mYN5yIkvxRyTXWOIZ32xms";
config.stormpath.STORMPATH_APP_HREF="https://api.stormpath.com/v1/applications/7FDamBX3BYNmiNdabuGBPm";
config.stormpath.EXPRESS_SECRET="ZKAKMSLKWMDOKMEFWOKNFONFKFNOFKMWEFOKWMEFWEFW";

// Stormpath - Dev
//config.stormpath.STORMPATH_APP_HREF="https://api.stormpath.com/v1/applications/5304GoBLzltgN1ZHtUJWqP";

// added comment for testing of creating a branch

config.aws.accessKey = "AKIAJB4SNNXFHBW6QTCA";
config.aws.secretAccessKey = "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";
config.aws.region = "us-east-1";
config.aws.sesApiVersion = '2010-12-01';
config.aws.sesArnSource = 'arn:aws:ses:us-east-1:599665533589:identity/contact.executiontrail@gmail.com';
config.aws.sesEmail = 'contact.executiontrail@gmail.com';

config.mongo.user_id= 'execution_trail';
config.mongo.password= 'Tool$1215';
config.mongo.tableNameUsers = 'users';
config.mongo.indexNameUsers = 'user_id-index';
config.mongo.tableNameSettings = 'settings';
config.mongo.indexNameSettings = '_id_';
config.mongo.apiVersion = '2012-08-10';
config.mongo.defaultLimit = 1000;
config.mongo.dbUri = "mongodb://execution_trail:Tool$1215@ds035593.mongolab.com:35593/execution_trail";
//config.mongo.dbUri = "mongodb://execution_trail:Tool$1215@ds019471.mlab.com:19471/execution_trail_demo";

config.defaults = {};
config.defaults.defaultPassword='Review$123';
config.defaults.defaultOriginEmail='contact.executiontrail@gmail.com';
config.defaults.defaultOutboundEmailUser='contact.executiontrail@gmail.com';
config.defaults.defaultOutboundEmailPassword='Gizmo$416';
config.defaults.defaultDestinationSalaryEmails=['contact.executiontrail@gmail.com'];

config.defaults.smtpHost = 'smtp.socketlabs.com';
config.defaults.smtpPort = 25;
config.defaults.smtpSecure = false;
config.defaults.smtpUser = 'server13546',
config.defaults.smtpPass = 'o3EPy45KsMd96GcBw';

config.responses.error = {error: "Error processing the request. Try again later."};
    config.responses.dataError = {error: "Data not found because of invalid data supplied."};
config.responses.serverError = {error: "Internal Server Error. Contact support if problem persists."};
config.responses.invalidRequestError = {error: "Invalid Request Error."};
config.responses.errorUnauthorized = {error: "The account is no longer authorized. Please login again."};
config.responses.forbiddenError = {error: "That behavior is forbidden."};
config.responses.conflictError = {error: "That request could not be completed due to a conflict with the current state of the resource."};
config.responses.duplicateError = {error: "The request would cause duplicate data. Please ensure all other instances of this tool are closed and refresh the page."};

//config.web.port = process.env.WEB_PORT || 9678;
config.web.port = 5678;
config.web.apiPrefix = '/api';

config.specialToken = "kljernagla346136123456kerjgnealktj234542351456blihjbgweougbailrbehgbtacorbgi1h4u1329418u498141";

config.reviewStartedSate =  "Started";
config.reviewCompletedSate =  "Completed";
config.reviewFinalizedSate =  "Finalized";

module.exports = config;