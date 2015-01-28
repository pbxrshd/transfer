var http = require('http'); // http module
var fs = require('fs');  // file system module
var querystring = require('querystring'); // querystring parser
var url = require('url');
var util = require('util');

// create the http server
http.createServer(function (request, response) {
  
  // register post sink
  var postContent = '';
  request.on('data', function(chunk){postContent += chunk;});
  request.on('end', function(){
     console.log('dataend ' + util.inspect(querystring.parse(postContent)));
  });
  
  console.log('\n' + request.method + ' request for ' + url.parse(request.url).pathname);
  //console.log('url:\n' + util.inspect(url.parse(request.url, true)));
  //console.log('request: ' + util.inspect(request.headers));
  // handle the routes
  if (request.method === 'POST') {
    console.log('\t handling post request...');
  } else { // request.method === 'GET'
    console.log('\t handling get request...');
  }
  // serve up file
  var pathname = url.parse(request.url).pathname;
  fs.readFile('.' + pathname, function (err, data) {
    if (err) {
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.end('file (' + pathname + ') not found: ' + err);
    } else {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.write(data);
      response.end();
    }
  });
  
}).listen(60193);
console.log('running on 60193...');
