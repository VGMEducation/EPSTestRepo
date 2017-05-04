var mongoose = require("mongoose");

var SettingsSchema = new mongoose.Schema({
    initialReview: Number,
    subsequentReview: Number,
    upcomingReview: Number,
    performanceHeaderText: String,
    coreComponentsPrefaceText: String,
    lastModified: Date
}, { collection: 'settings' });

var Setting = mongoose.model('Setting', SettingsSchema);

module.exports = Setting;