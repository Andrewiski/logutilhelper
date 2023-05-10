'use strict';

const http = require('http');
const path = require('path');
const express = require('express');
const ioServer = require('socket.io');
const httpPort = 8080;
//const LogUtilHelper = require('logutilhelper');
var LogUtilHelper = null;
if (process.env.USELOCALLIB === "true"){
    LogUtilHelper = require('../../logutilhelper.js');
}else{
    LogUtilHelper = require('logutilhelper');
    
}

var logUnfilteredEventHandler = function(logdata){
    //This gets called on every log event even trace events
    //console.log("logUnfilteredEventHandler", logdata);
    let needToDeleteliveLogSockets = [];
    for (const item of Object.values(privateData.liveLogSockets)) {
        if(item.timestamp < new Date() - 1000 * 180){
            //if the subscription is older than 3 minutes, delete it
            needToDeleteliveLogSockets.push(item.socket.id);
        }else{
            if(item.socket !== undefined){
                if(logUtilHelper.shouldLogAppLogLevels(item.appLogLevels, logdata.appName, logdata.appSubname, logdata.logLevel)===true){
                    item.socket.emit('logs', {cmd: "liveLog", data: logdata});
                }
            }
        }
    };
    needToDeleteliveLogSockets.forEach(element => {
        delete privateData.liveLogSockets[element];
    });
}

var logEventHandler = function(logdata){
    //This only get called if the log level is equal or higher then the appLogLevel
    console.log("logEventHandler", logdata);
}

var logOptions = {

    appLogLevels:{
        "app":{
            "server": "info",
            "browser": "info"
        },
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

var logUtilHelper = new LogUtilHelper(logOptions);
var logCounter = 0;

var createSomeLogEvents = function(){
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
    logCounter++;
};

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use( function (req, res, next) {
    logUtilHelper.logRequestConnectionInfo("app", "server", "info", req, req.url);
    next();
});

//appLogLevels
app.use("/api/logLevels", function (req, res) {
    res.json(logUtilHelper.options.appLogLevels);
});

app.use("/api/logs", function (req, res) {
    res.json(logUtilHelper.memoryData.logs);
});

app.use("/index.html", function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use("/", function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

var http_srv = null;
http_srv = http.createServer(app).listen(httpPort, function () {
    logUtilHelper.log("app", "server", "info", 'Express server listening on port ' + httpPort);
    console.log('Express server listening on port ' + httpPort);
});


 var privateData = { 
     liveLogSockets: {}
 };

var io = ioServer();
io.attach(http_srv);

io.on('connection', function (socket) {

    try{
        // if (privateData.browserSockets[socket.id] === undefined) {
        //     privateData.browserSockets[socket.id] = {
        //         socket: socket
        //     };
        // }

        logUtilHelper.logSocketConnection("app", "server", "info", socket, 'connection');
        socket.on('ping', function (data) {
            try {
                logUtilHelper.log("app", "server", "trace", 'browser', socket.id, "ping");
            } catch (ex) {
                logUtilHelper.log("app", "server", 'error', 'Error socket on', ex);
            }
        });

        
        socket.on('logs', function (request) {
            try {
                logUtilHelper.log("app", "server", "debug", 'browser', socket.id, "logs", request);
                switch(request.cmd){
                    case "get":
                        socket.emit('logs', {cmd: "get", data: logUtilHelper.memoryData.logs});
                        break;
                    case "subscribe":
                        if(privateData.liveLogSockets[socket.id] !== undefined){
                            privateData.liveLogSockets[socket.id].timestamp = new Date();
                        }else{
                            privateData.liveLogSockets[socket.id] = {socket: socket, timestamp: new Date(), appLogLevels: request.data.appLogLevels};
                        }
                        break;
                    case "resubscribe":
                        if(privateData.liveLogSockets[socket.id] !== undefined){
                            privateData.liveLogSockets[socket.id].timestamp = new Date();
                        }else{
                            privateData.liveLogSockets[socket.id] = {socket: socket, timestamp: new Date()};
                            //tell the client to resend appLogLevels as we do not have them
                            socket.emit('logs', {cmd: "subscribe", data: {}});
                        }
                        break;
                    case "setAppLogLevels":
                        if(privateData.liveLogSockets[socket.id] !== undefined){
                            privateData.liveLogSockets[socket.id].appLogLevels =  request.data.appLogLevels;
                        }else{
                            privateData.liveLogSockets[socket.id] = {socket: socket, timestamp: new Date(), appLogLevels:request.data.appLogLevels};
                        }
                        break;
                    case "unsubscribe":
                        delete privateData.liveLogSockets[socket.id] ;
                        break;    
                }
            } catch (ex) {
                logUtilHelper.log("app", "server", 'error', 'Error socket on', ex);
            }
        });

        socket.on('btnTest', function (data) {
            try {
                logUtilHelper.log("app", "server", "debug", 'browser', socket.id, "btnTest");
        
            } catch (ex) {
                logUtilHelper.log("app", "server", 'error', 'Error socket on', ex);
            }
        });
    } catch (ex) {
        logUtilHelper.log("app", 'browser', 'error', 'Error socket on connection', ex);
        throw ex;
    }


});






createSomeLogEvents();
var test =  setInterval(createSomeLogEvents, 1000);