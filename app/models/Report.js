var mongoose = require("mongoose");

var ReportsSchema = new mongoose.Schema({
    locationId: String,
    location: String,
    name: String,
    order: Number,
    active: Boolean,
    text: String,
    createDate: Date
}, { collection: 'users' });

var Report = mongoose.model('Report', ReportsSchema);

module.exports = Report;