var mongoose = require("mongoose");

var QuestionsSchema = require("../models/Question");

var RolesSchema = new mongoose.Schema({
    roleId: Number,
    roleName: String,
    active: Boolean,
    softDelete: Boolean,
    hasReports: Boolean,
    isHR: Boolean,
    hasCoreComponentsQuestion: Boolean,
    questions: [QuestionsSchema],
    createDate: Date,
    performanceHeaderText: "",
    subsequentReview: Number
}, { collection: 'roles' });

var Role = mongoose.model('Role', RolesSchema);

module.exports = Role;