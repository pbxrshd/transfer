// require['jquery','main']
"use strict";
var F1 = (function() {
  var ID = "f1";
  function init() {
    getData();
  }
  //
  function getData() {
    var promise = MAIN.getData(ID);
    promise.done(function(data) {
      var html = '';
      data.forEach(function(e,i) {
          html += '<div><div class="bar1 color-l-'+i+'" style="width:'+(2*e)+'px;">&nbsp;</div></div>';
        });
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

F1.init();
