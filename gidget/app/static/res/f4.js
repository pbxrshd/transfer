// require['jquery','main']
"use strict";
var F4 = (function() {
  var ID = "f4";
  function init() {
    getData();
  }
  //
  function getData() {
    var promise = MAIN.getData(ID);
    promise.done(function(data) {
      var html = '<table class="table table-striped">';
      data[0].forEach(function(e,i) {
          html += '<tr>';
          html += '<td>'+data[0][i]+'</td><td>'+data[1][i]+'</td><td>'+data[2][i]+'</td><td>'+data[3][i]+'</td>';
          html += '</tr>';
        });
      html += '</table>';
      document.querySelector('#'+ID+' div.content').innerHTML = html;
    });    
    promise.fail(function() {
      document.querySelector('#'+ID+' div.status').innerHTML = 'Error getting data';
      });
  }
  //
  return {
    init : init,
    getData : getData
  };
})();

F4.init();
