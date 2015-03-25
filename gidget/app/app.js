var express = require('express');
var app = express();

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/data/:id', function (req,res) {
  var id = req.params.id;
  console.log('data id :' + id); 
  var data = {}; 
  res.json(data);
});

app.use(function(req, res, next) {
  res.status(404).send('Can\'t find ' + req.path);
});

var server = app.listen(60143, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('listening at http://%s:%s', host, port);
})
