'use strict';

//const LogUtilHelper = require('logutilhelper');
var LogUtilHelper = null;
if (process.env.USELOCALLIB === "true"){
    LogUtilHelper = require('../../logutilhelper.js');
}else{
    LogUtilHelper = require('logutilhelper');
    
}

var logUnfilteredEventHandler = function(logdata){
    console.log("logUnfilteredEventHandler", logdata);
}

var logEventHandler = function(logdata){
    console.log("logEventHandler", logdata);
}

var logOptions = {

    appLogLevels:{
        "app1":{
            "subapp": "info",
            "browser": "info"
        },
        "app2":{
            "subapp1": "trace",
            "subapp2": "info"
        }
        
    },
    logEventHandler: logEventHandler,
    logUnfilteredEventHandler: logUnfilteredEventHandler,
    logFolder: "logs",
    logName: "app",
    debugUtilEnabled: true,
    debugUtilName:"app",
    debugUtilUseUtilName: true,
    debugUtilUseAppName: true,
    debugUtilUseAppSubName: true,
    includeErrorStackTrace: false,
    logToFile: true,
    logToMemoryObject: true,
    logToMemoryObjectMaxLogLength: 100,
    logSocketConnectionName: "app",
    logRequestsName: "app",
}

var logUtilHelper = new LogUtilHelper(
    logOptions   

);


var logCounter = 0;

var test =  setInterval(() => {
    
    logUtilHelper.log("app1", "subapp", "trace", "This is an trace Log ", logCounter);
    logUtilHelper.log("app2", "subapp1", "trace", "This is an trace Log ", logCounter);

    

    if(logCounter % 2 == 0){
        logUtilHelper.log("app1", "subapp", "debug", "This is an debug Log ", logCounter);
    }
    if(logCounter % 3 == 0){
        logUtilHelper.log("app1", "subapp", "info", "This is an info Log ", logCounter);
    }
    if(logCounter % 4 == 0){
        logUtilHelper.log("app1", "subapp", "warning", "This is an warning Log ", logCounter);
    }
    if(logCounter % 5 == 0){
        logUtilHelper.log("app1", "subapp", "error", "This is an error Log ", logCounter);
    }
}, 1000);

