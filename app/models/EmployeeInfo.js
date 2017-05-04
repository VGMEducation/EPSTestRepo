var mongoose = require("mongoose");

var EmployeeSchema = require("../models/Employee");
var QuestionsSchema = require("../models/Question");

var EmployeeInfoSchema = new mongoose.Schema({
    uid: String,
    location: String,
    employeeName: String,
    firstName: String,
    lastName: String,
    email: String,
    active: Boolean,
    isAdmin: Boolean,
    text: String,
    hrRep: String,
    isHR: Boolean,
    hasReviewAccess: Boolean,
    hasReports: Boolean,
    isCustodian: Boolean,
    isCorporateAdmin: Boolean,
    isFacilityAdmin: Boolean,
    supervisor: String,
    role: String,
    lastReviewDate: Number,
    nextReviewDate: Number,
    supervisorName: String,
    locationName: String,
    roleName: String,
    hrRepName: String,
    createDate: Date,
    hireDate: Number,
    //myReviews: [QuestionsSchema],
    //myEmployees: [EmployeeSchema],
    myReviews: [],
    myEmployees: [],
    performanceHeaderText: "",
}, { collection: 'users' });

var EmployeeInfo = mongoose.model('EmployeeInfo', EmployeeInfoSchema);

module.exports = EmployeeInfo;