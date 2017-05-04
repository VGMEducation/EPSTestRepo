var mongoose = require("mongoose");

// This is a dedicated sub-document. There is no collection associated to it.

var SalarySchema = new mongoose.Schema({
    //_id: String,
    currentRateOfPay: Number,
    currentSalaryGrade: Number,
    yearsOfService: Number,
    proposedRateOfPay: Number,
    proposedSalaryGrade: Number,
    effectiveDate: Number,
    followsFacilityWageApproval: Boolean,
    explanation: String,
    employeeComments: String
});

//var Salary = mongoose.model('Salary', SalarySchema);

module.exports = SalarySchema;