// require['jquery','main']
"use strict";
var F2 = (function() {
  var ID = "f2";
  function init() {
    getData();
  }
  //
  function getData() {
    var promise = MAIN.getData(ID);
    promise.done(function(data) {
      var html = '';
      data.forEach(function(e) {
          html += '<li>$' + e + '</li>';
        });
      html = '<ul>' + html + '</ul>';
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

F2.init();
