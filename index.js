exports.Eyes = require('./src/Eyes');
var EyesSDK = require('eyes.sdk');
exports.ConsoleLogHandler = EyesSDK.ConsoleLogHandler;
exports.NullLogHandler  = EyesSDK.NullLogHandler;
exports.Triggers = EyesSDK.Triggers;
exports.MatchLevel = EyesSDK.MatchLevel;
exports.ImageMatchSettings = EyesSDK.ImageMatchSettings;
exports.ExactMatchSettings = EyesSDK.ExactMatchSettings;
var eyesBase = EyesSDK.EyesBase;
exports.FailureReport = eyesBase.FailureReport;
var EyesUtils = require('eyes.utils');
exports.TestResultsFormatter = EyesUtils.TestResultsFormatter;
