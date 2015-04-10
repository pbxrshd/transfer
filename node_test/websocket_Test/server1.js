var websocket = require('websocket').server;
var http = require('http');
var path = require("path");
var url = require("url");
var fs = require("fs");

var websocketServerOptions = {port:61337};
var httpServerOptions = {port:61336};

// http server
var httpServer = http.createServer(function(request,response) {
  var full_path = path.join(process.cwd(), url.parse(request.url).pathname);
  fs.exists(full_path,function(exists) {
    if(!exists) {
      response.writeHeader(404, {"Content-Type": "text/plain"});  
      response.write("404 Not Found\n");  
      response.end();
    } else {
      fs.readFile(full_path, "binary", function(err, file) {  
         if(err) {  
           response.writeHeader(500, {"Content-Type": "text/plain"});  
           response.write(err + "\n");  
           response.end();  
         }  
         else{
          response.writeHeader(200);  
          response.write(file, "binary");  
          response.end();
        }
      });
    }
  });
}).listen(httpServerOptions.port);
console.log('http server listening on ' + httpServerOptions.port);

// web socket server
var websocketServer = new websocket({
  httpServer: http.createServer().listen(websocketServerOptions.port)
});
console.log('websocket server listening on ' + websocketServerOptions.port);

websocketServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);

  connection.on('message', function(message) {
    console.log(message.utf8Data);
    connection.sendUTF('echoing ' + message.utf8Data);
  });

  connection.on('close', function(connection) {
    console.log('connection closed');
  });
}); 