/*jslint node: true */
'use strict';
var Allure = require('allure-js-commons');
var path = require('path');

function CucumberAllureReporter(baseReporterDecorator, config) {
    config.files.unshift(this.createClientScriptConfig(path.resolve(__dirname, '../client/allure.js')));
    config.allureReport = config.allureReport || {};

    var outDir = config.allureReport.reportDir ? path.resolve(config.basePath, config.allureReport.reportDir) : undefined;

    var _this = this;
    this.report = {};

    this.allure = new Allure();
    this.allure.setOptions({
        targetDir: outDir
    });
    this.suites = {};
    baseReporterDecorator(this);

    this.onRunComplete = function () {
        for (var feature in _this.report) {
            this.processFeature(_this.report[feature]);
        }
    };

    this.onSpecComplete = function (browser, result) {
        this.addTimeToResult(result);

        if (!_this.report[result.suite[0]]) {
            _this.report[result.suite[0]] = {
                name: result.suite[0],
                featureStatus: null,
                browser: browser,
                start: result.start,
                scenarios: []
            };
        }
        var stepStatus = this.getStepStatus(result);
        if (!_this.report[result.suite[0]].scenarios[result.suite[1]]) {
            this.createFeature(_this, result);
        }

        _this.report[result.suite[0]].scenarios[result.suite[1]].status = this.mergeStatus(_this.report[result.suite[0]][result.suite[1]], stepStatus);
        _this.report[result.suite[0]].scenarios[result.suite[1]].stop = result.stop;
        _this.report[result.suite[0]].scenarios[result.suite[1]].steps.push(result);
        _this.report[result.suite[0]].stop = result.stop;
    };
}

CucumberAllureReporter.prototype.processSteps = function (scenario) {
    scenario.status = this.passed;
    for (var stepName in scenario.steps) {
        var step = scenario.steps[stepName];
        var status = this.passed;
        if (step.skipped) {
            status = this.pending;
        } else if (step.success === false) {
            status = this.failed;
        }
        if (scenario.status !== this.failed) {
            //fail overrides pending
            scenario.status = status;
        }
        this.allure.startStep(step.description, step.start);
        this.allure.endStep(status, step.stop);
    }
};

CucumberAllureReporter.prototype.processFeature = function (feature) {
    this.getSuite(feature.browser, feature);
    for (var scenarioName in feature.scenarios) {
        var scenario = feature.scenarios[scenarioName];

        this.allure.startCase(scenario.name, scenario.start);

        var testcase = this.allure.getCurrentSuite().currentTest;
        testcase.addLabel('feature', feature.name);

        this.processSteps(scenario);

        var err = this.getTestcaseError(scenario);
        this.allure.endCase(scenario.status, err, scenario.stop);
    }
    this.allure.endSuite(Date.now());
};

CucumberAllureReporter.prototype.createFeature = function (_this, result) {
    _this.report[result.suite[0]].scenarios[result.suite[1]] = {};
    _this.report[result.suite[0]].scenarios[result.suite[1]].name = result.suite[1];
    _this.report[result.suite[0]].scenarios[result.suite[1]].start = result.start;
    _this.report[result.suite[0]].scenarios[result.suite[1]].steps = [];
};

CucumberAllureReporter.prototype.getStepStatus = function (result) {
    if (result.success) {
        return !result.skipped ? CucumberAllureReporter.passed : CucumberAllureReporter.pending;
    }
    return !result.skipped ? CucumberAllureReporter.failed : CucumberAllureReporter.pending;
};

CucumberAllureReporter.prototype.addTimeToResult = function (result) {
    result.stop = Date.now();
    result.start = result.stop - result.time;
    return result;
};

CucumberAllureReporter.prototype.getSuite = function (browser, feature) {
    var suiteName = '[' + browser + '] ' + feature.name;
    this.allure.startSuite(suiteName, feature.start);
};

CucumberAllureReporter.prototype.mergeStatus = function (currStatus, newStatus) {
    if (currStatus === CucumberAllureReporter.failed) {
        return CucumberAllureReporter.failed;
    }
    if (currStatus === CucumberAllureReporter.pending) {
        return CucumberAllureReporter.pending;
    }
    return newStatus;
};

CucumberAllureReporter.prototype.getTestcaseError = function (scenario) {
    if (scenario.skipped) {
        return {
            message: 'This test was ignored',
            stack: ''
        };
    }
    var log = scenario.log ? scenario.log[0] : null;
    if (log) {
        log = log.split('\n');
        return {
            message: log[0],
            stack: log.slice(1).join('\n')
        };
    }
};

CucumberAllureReporter.prototype.createClientScriptConfig = function (path) {
    return {
        pattern: path,
        included: true,
        served: true,
        watched: false
    };
};

CucumberAllureReporter.prototype.getTestcaseStatus = function (scenario, err) {
    if (scenario.status === CucumberAllureReporter.passed) {
        return 'passed';
    }
    if (scenario.skipped) {
        return 'pending';
    } else if (scenario.success) {
        return 'passed';
    } else {
        return err && err.message.indexOf('Expected') > -1 ? 'failed' : 'broken';
    }
};

CucumberAllureReporter.$inject = ['baseReporterDecorator', 'config', 'emitter', 'logger', 'helper'];
CucumberAllureReporter.prototype.passed = 'passed';
CucumberAllureReporter.prototype.failed = 'failed';
CucumberAllureReporter.prototype.pending = 'pending';
module.exports = CucumberAllureReporter;