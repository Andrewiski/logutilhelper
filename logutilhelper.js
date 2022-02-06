"use strict";

const path = require('path');
const extend = require('extend');
const winston = require('winston');
const moment = require('moment');
require('winston-daily-rotate-file');

var LogUtilHelper = function (options) {
    var self = this;
    var defaultOptions = {
        appLogLevels:{
            application:{"app": "info"}
        },
        logEventHandler: null,
        logUnfilteredEventHandler: null,
        logFolder: "log",
        logName: "app",
        debugUtilEnabled: true,
        debugUtilName:"app",
        logToFile: true,
        logToFileLogLevel: "Info",
        logToMemoryObject: true,
        logToMemoryObjectMaxLogLength: 100,
        logSocketConnectionName: "app",
        logRequestsName: "app",
    }
    
    self.options = extend({}, defaultOptions, options);

    self.memoryData = {
        logs:[]
    };
   
    const debug = require('debug')(self.options.debugUtilName);

    let winstonstreamerLogLevel = self.options.logLevel;
    switch (self.options.logLevel) {
        case "panic":
        case "fatal":
            winstonstreamerLogLevel = "error";
            break;
        case "warning":
            winstonstreamerLogLevel = "warn";
            break;
        case "verbose":
            winstonstreamerLogLevel = "debug";
            break;
        case "trace":
            winstonstreamerLogLevel = "silly";
            break;
    }

    var logFile = null;
    var logRequestsFile = null;
    var logSocketConnectionFile = null
    
    if(self.options.logToFile){
        logFile = winston.createLogger({
            level: winstonstreamerLogLevel,
            exitOnError: false,
            transports: [
                //new winston.transports.Console(),
                new (winston.transports.DailyRotateFile)({
                    filename: path.join(self.options.logFolder, '%DATE%-' + self.options.logName + '.log'),
                    datePattern: 'YYYY-MM-DD-HH',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d'
                })
            ]
        });

        if (self.options.logName !== self.options.logRequestsName){
            logRequestsFile = winston.createLogger({
                level: winstonstreamerLogLevel,
                exitOnError: false,
                transports: [
                    //new winston.transports.Console(),
                    new (winston.transports.DailyRotateFile)({
                        filename: path.join(self.options.logFolder, '%DATE%-' + self.options.self.options.logRequestsName + '.log'),
                        datePattern: 'YYYY-MM-DD-HH',
                        zippedArchive: true,
                        maxSize: '20m',
                        maxFiles: '14d'
                    })
                ]
            });
        }else{
            logRequestsFile = logFile;
        }

        if (self.options.logName !== self.options.logSocketConnectionName){
            logSocketConnectionFile = winston.createLogger({
                level: winstonstreamerLogLevel,
                exitOnError: false,
                transports: [
                    //new winston.transports.Console(),
                    new (winston.transports.DailyRotateFile)({
                        filename: path.join(self.options.logFolder, '%DATE%-' + self.options.self.options.logSocketConnectionName + '.log'),
                        datePattern: 'YYYY-MM-DD-HH',
                        zippedArchive: true,
                        maxSize: '20m',
                        maxFiles: '14d'
                    })
                ]
            });
        }else{
            logSocketConnectionFile = logFile;
        }
    }

    var isObject = function (a) {
        return (!!a) && (a.constructor === Object);
    };

    var isArray = function (a) {
        return (!!a) && (a.constructor === Array);
    };

    var arrayPrint = function (obj) {
        var retval = '';
        var i;
        for (i = 0; i < obj.length; i++) {
            if (retval.length > 0) {
                retval = retval + ', ';
            }
            retval = retval + objPrint(obj[i]);
        }

        return retval;
    };

    var objPrint = function (obj) {


        if (obj === null) {
            return 'null';
        } else if (obj === undefined) {
            return 'undefined';
        } else if (isArray(obj)) {
            return arrayPrint(obj);
        } else if (isObject(obj)) {
            return JSON.stringify(obj);
        } else {
            return obj.toString();
        }

    };



    var logLevels = {
        'quiet': -8, //Show nothing at all; be silent.
        'panic': 0, //Only show fatal errors which could lead the process to crash, such as an assertion failure.This is not currently used for anything.
        'fatal': 8, //Only show fatal errors.These are errors after which the process absolutely cannot continue.
        'error': 16, //Show all errors, including ones which can be recovered from.
        'warning': 24, //Show all warnings and errors.Any message related to possibly incorrect or unexpected events will be shown.
        'info': 32, //Show informative messages during processing.This is in addition to warnings and errors.This is the default value.
        'verbose': 40,  //Same as info, except more verbose.
        'debug': 48, //Show everything, including debugging information.
        'trace': 56
    };

    var getLevelIntegerValue = function (logLevelName) {

        if (logLevels[logLevelName]) {
            return logLevels[logLevelName];
        } else {
            return 100;  // Not found dump it to the screen like its a trace
        }
    };

    var getLogLevel = function ( appName, appSubname) {

        return getLogLevelAppLogLevels(self.options.appLogLevels, appName, appSubname)

        if (self.options.appLogLevels[appName] && self.options.appLogLevels[appName][appSubname]) {
            return getLevelIntegerValue(self.options.appLogLevels[appName][appSubname]);
        } else {
            return 100;  // Not found dump it to the screen like its a trace
        }
    };

    var getLogLevelAppLogLevels = function (appLogLevels, appName, appSubname) {

        if (appLogLevels[appName] && appLogLevels[appName][appSubname]) {
            return getLevelIntegerValue(appLogLevels[appName][appSubname]);
        } else {
            return 100;  // Not found dump it to the screen like its a trace
        }
    };

    var shouldLog = function ( appName, appSubname, logLevelName) {

        if (getLevelIntegerValue(logLevelName) <= getLogLevel( appName, appSubname) ) {
            return true;
        } else {
            return false;
        }
    };

    var shouldLogToFile = function (logLevelName, logToFileLogLevel) {
        if (getLevelIntegerValue(logLevelName) <= getLevelIntegerValue(logToFileLogLevel) ) {
            return true;
        } else {
            return false;
        }
    };


    var getRequestConnectionInfo = function (req) {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (ip.substr && ip.substr(0, 7) === "::ffff:") {
            ip = ip.substr(7);
        }
        var port = req.connection.remotePort;
        var ua = req.headers['user-agent'];
        return { ip: ip, port: port, ua: ua };
    };

    var getSocketInfo = function (socket) {
        var ip = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
        if (ip.substr && ip.substr(0, 7) === "::ffff:") {
            ip = ip.substr(7);
        }
       
        return { ip: ip };
    };

    var log = function (appName, appSubname, logLevel) {
        try {
            let args = []
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] === undefined) {
                    args.push("undefined")
                } else if (arguments[i] === null) {
                    args.push("null")
                }
                else {
                    args.push(JSON.parse(JSON.stringify(arguments[i])))
                }
                
            }

            let shouldLogResult = shouldLog(appName, appSubname, logLevel)
            if ( shouldLogResult === true) {

                if(self.options.debugUtilEnabled){
                    debug(arrayPrint(args));
                }
            }

            if (args.length > 1) {
                args.shift(); //remove the appName from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the appSubname from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the loglevel from the array
            }
            let logData = { timestamp: new Date(), appName: appName, appSubname:appSubname, logLevel: logLevel, args: args };
            
            try {
                if (self.options.logEventHandlerUnfiltered) {
                    self.options.logEventUnfiltered(logData);
                }
            } catch (ex) {
                console.log("error", "LogUtilHelper.js", "An Error Occured calling logEventHandler", ex);
            }
            
            if ( shouldLogResult === true) {

                
                if(self.options.logToFile && shouldLogToFile(logLevel, self.options.logLevel) === true ){
                    let winstonLogLevel = logLevel;
                    switch (logLevel) {
                        case "panic":
                        case "fatal":
                            winstonLogLevel = "error";
                            break;
                        case "warning":
                            winstonLogLevel = "warn";
                            break;
                        case "verbose":
                            winstonLogLevel = "debug";
                            break;
                        case "trace":
                            winstonLogLevel = "silly";
                            break;
                    }
                    logFile.log({ timestamp: new Date(), level: winstonLogLevel, appName: appName, appSubname:appSubname, message: args });
                }
                
                
                if(self.options.logToMemoryObject){
                    self.memoryData.logs.push(logData);
                    if (self.memoryData.logs.length > self.options.logToMemoryObjectMaxLogLength) {
                        self.memoryData.logs.shift();
                    }
                }
                try {
                    if (self.options.logEventHandler) {
                        self.options.logEventHandler(logData);
                    }
                } catch (ex) {
                    console.log("error", "LogUtilHelper.js", "An Error Occured calling logEventHandler", ex);
                }
            }

            

        } catch (ex) {
            console.log("error", "LogUtilHelper.js",  'Error on log', ex);
        }
    };

    var logSocketConnection = function (appName, appSubname, logLevel, socket){
        let args = []
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] === undefined) {
                    args.push("undefined");
                } else if (arguments[i] === null) {
                    args.push("null");
                }
                else {
                    args.push(arguments[i]);
                }
                
            }

            if (args.length > 1) {
                args.shift(); //remove the appName from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the appSubname from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the loglevel from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the socket from the array
            }
            log(appName, appSubname, log)
    }

    var logRequestConnectionInfo = function(appName, appSubname, logLevel, req){
        let args = []
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] === undefined) {
                    args.push("undefined");
                } else if (arguments[i] === null) {
                    args.push("null");
                }
                else {
                    args.push(arguments[i]);
                }
                
            }

            if (args.length > 1) {
                args.shift(); //remove the appName from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the appSubname from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the loglevel from the array
            }
            if (args.length > 1) {
                args.shift(); //remove the socket from the array
            }
            var connInfo = getConnectionInfo(req);
            log(appname, appSubname, logLevel,   {path:req.path, ip: connInfo.ip, port:connInfo.port, ua:connInfo.ua});
    }

    self.log = log;
    self.logSocketConnection = logSocketConnection;
    self.logRequestConnectionInfor = logRequestConnectionInfo;
    self.isObject = isObject;
    self.isArray = isArray;
    self.arrayPrint = arrayPrint
    self.objPrint = objPrint;
    self.getSocketInfo = getSocketInfo;
    self.getRequestConnectionInfo = getRequestConnectionInfo;
    self.shouldLog = shouldLog;
    self.getLogLevelAppLogLevels = getLogLevelAppLogLevels;

};
module.exports = LogUtilHelper;