var mongoose = require("mongoose");

var SalarySchema = require("../models/Salary");

var ReviewsSchema = new mongoose.Schema({
    actualReviewDate: Number,
    lastReviewDate: Number,
    nextReviewDate: Number,
    currentRole: {},
    education: String,
    email: String,
    employeeName: String,
    goals: String,
    growthOpportunities: String,
    hireDate: Number,
    hrRep: String,
    hrRepName: String,
//    isHR: Boolean,
    supervisor: String,
    supervisorName: String,
    location: String,
    locationName: String,
    role: String,
    roleName: String,
    roleId: String,
    overallScore: Number,
    performanceHeaderText: String,
    subsequentReview: Number,
    salaryNotificationSent: Boolean,
//    salary: {SalarySchema},
    salary: Object,
    reviewId: String,
    reviewEmployeeId: String,
    reviewQuestions: [],
    supervisorReviewDate: Number,
    deptHeadReviewDate: Number,
    adminReviewDate: Number,
    employeeReviewDate: Number,
    signatureUrl1: String,
	signatureUrl2: String,
	signatureUrl3: String,
	signatureUrl4: String,
	signatureLabel1: String,
    signatureLabel2: String,
    signatureLabel3: String,
    signatureLabel4: String,
    state: String,
    completedNotificationSent: Boolean,
    salaryNotificationSent: Boolean,
    created_at: Date
}, { collection: 'reviews' });


var Reviews = mongoose.model('Reviews', ReviewsSchema);

module.exports = Reviews;
