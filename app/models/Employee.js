var mongoose = require("mongoose");

var EmployeesSchema = new mongoose.Schema({
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
    supervisor: String,
    role: String,
    lastReviewDate: Number,
    nextReviewDate: Number,
    supervisorName: String,
    locationName: String,
    roleName: String,
    hasReports: Boolean,
    isCustodian: Boolean,
    isCorporateAdmin: Boolean,
    isFacilityAdmin: Boolean,
    hrRepName: String,
    createDate: Date,
    hireDate: Number
}, { collection: 'users' });

var Employee = mongoose.model('Employee', EmployeesSchema);

module.exports = Employee;
