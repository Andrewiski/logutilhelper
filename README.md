# LogUtilHelper
 Node.js Logger
 '''
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
 '''
