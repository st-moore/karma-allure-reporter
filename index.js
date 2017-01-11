/*jslint node: true */
"use strict";
var AllureReporter = require('./src/CucumberAllureReporter');

// PUBLISH DI MODULE
module.exports = {
    'reporter:cucumber-allure': ['type', AllureReporter]
};