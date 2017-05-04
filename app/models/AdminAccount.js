var mongoose = require("mongoose");

var AdminAccountSchema = new mongoose.Schema({
    facilityAdmins: [],
    corporateAdmins: [],
    adminLicencesInfo: {},
    lastModified: Date
}, { collection: 'settings' });

var AdminAccount = mongoose.model('AdminAccount', AdminAccountSchema);

module.exports = AdminAccount;