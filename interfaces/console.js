var config = require('../config.json');
var io = require('socket.io').listen(config.daemon.consoleport);

var GameServer = require('../services/gameprocess.js');

GameServer.prototype.initconsole = function(index){
  var self = this;
  this.console = io.of('/'+index);
 
  this.on('console', function(data){
    self.console.emit('console', {'l':data.toString()});
  });
    
  this.on('statuschange', function(data) {
    self.console.emit('statuschange', {'status':self.status});
  });
    
  this.on('query', function(data) {
    self.console.emit('query', {"query":self.lastquery()});
  });
    

  this.on('processStats', function(data) {
    self.console.emit('process', {"process":self.usagestats});
  });
    
  this.console.on('sendconsole', function (command) {
    self.send(command);
  });
}