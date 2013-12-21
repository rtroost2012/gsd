var spawn = require('child_process').spawn;
var config = require('./config');
var util = require("util");
var events = require("events");
var plugins = require("./plugins.js").plugins;

var OFF = 0; ON = 1, STARTING = 2, STOPPING = 3;

function GameServer() {
  self = this;
  this.status = OFF;
  this.commandline = config.server.command_line;
  this.plugin = plugins[config.server.plugin + '.js']; 
};

util.inherits(GameServer, events.EventEmitter);

GameServer.prototype.turnon = function(){
    // Shouldn't happen, but does on a crash after restart
    if (!self.status == OFF){
      console.log("Tried to turn on but status is already : " + self.status); 
      return      
    }
      
    this.ps = spawn(config.server.command_line);
    this.output = this.ps.stdout;
    self.status = STARTING;

    this.output.on('data', function(data){
      output = data.toString();
      console.log(output);
      self.emit('console', output);
    });
    
    
    this.ps.on('exit', function(){
      if (self.status == STOPPING){
	console.log("Process stopped");
	self.status = OFF;1
	self.emit('off');
        return;	
      }
     
      if (self.status == ON || self.status == STARTING){
	console.log("Process died a horrible death");
	self.status = OFF;	
        self.emit('crash');
	return;
      }

    });
    
    this.on('crash', function(){
      console.log("Restarting after crash");      
      this.turnon();
    });
}

GameServer.prototype.turnoff = function(){
  self.status = STOPPING; 
  this.kill()
}

GameServer.prototype.restart = function(){
  self.once('off', function (stream) {self.turnon()});
  this.turnoff();
}

GameServer.prototype.kill = function(){
  this.ps.kill();
}

GameServer.prototype.send = function(data){
  this.ps.write(data);
}

module.exports = GameServer;