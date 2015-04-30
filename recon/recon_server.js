
/* requires */
var websocket = require('websocket').server;
var http = require('http');
var path = require("path");
var url = require("url");
var fs = require("fs");
var serialport = require("serialport");
var	SerialPort  = serialport.SerialPort;

/* options */
var websocketServerOptions = {port:61337};
var httpServerOptions = {port:61336};
var serialPortOptions = {baudRate:9600, parser:serialport.parsers.readline("\n")};
var serialPortName = "/dev/tty-usbserial1";

/* http server */
var httpServer = http.createServer(function(request,response) {
  var full_path = path.join(process.cwd(), url.parse(request.url).pathname);
  fs.exists(full_path,function(exists) {
    if (!exists) {
      response.writeHeader(404, {"Content-Type": "text/plain"});  
      response.write("404 Not Found\n");  
      response.end();
    } else {
      fs.readFile(full_path, "binary", function(err, file) {  
         if (err) {  
           response.writeHeader(500, {"Content-Type": "text/plain"});  
           response.write(err + "\n");  
           response.end();  
         } else {
          response.writeHeader(200);  
          response.write(file, "binary");  
          response.end();
        }
      });
    }
  });
}).listen(httpServerOptions.port);
console.log('http server listening on ' + httpServerOptions.port);


/* serial port */
var serialCom = new SerialPort(serialPortName, serialPortOptions);
serialCom.on('open', function() {
  console.log('serial port ' + serialPortName + ' open. data rate:' + serialPortOptions.baudRate);
});
serialCom.on('close', function() {
  console.log('serial port closed.');
});
serialCom.on('error', function(error) {
  console.log('serial port error:' + error);
});


/* web socket server */
var websocketServer = new websocket({
  httpServer: http.createServer().listen(websocketServerOptions.port)
});
//
console.log('websocket server listening on ' + websocketServerOptions.port);
//
websocketServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  connection.on('message', function(messagePacket) {
    console.log('recvd:' + messagePacket.utf8Data);
    var message = JSON.parse(messagePacket.utf8Data);
    switch (message.op) {
      case 'send':
        serialCom.write(message.data, function (){
          serialCom.on('data', function(data) {
            connection.sendUTF(data);
          });	
        });         
        break;
      default:
        break;
    }
  });
  connection.on('close', function(connection) {
    console.log('connection closed');
  });
});

