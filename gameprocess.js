var spawn = require('child_process').spawn;
var util = require("util");
var events = require("events");
var plugins = require("./plugins.js").plugins;
var merge = require("./utls.js").merge;

var OFF = 0; ON = 1, STARTING = 2, STOPPING = 3;

function GameServer(config) {
  self = this;
  this.status = OFF;
  this.config = config;
  this.joined = ["-Xmx", "-XX:PermSize="];
  this.plugin = plugins[this.config.plugin + '.js'];
  this.variables = merge(this.joined, this.plugin.defaultvariables, this.config.variables);
  this.exe = this.plugin.exe;
  
  console.log(this.variables);
  console.log("done");
  
};

util.inherits(GameServer, events.EventEmitter);

GameServer.prototype.turnon = function(){
    // Shouldn't happen, but does on a crash after restart
    if (!self.status == OFF){
      console.log("Tried to turn on but status is already : " + self.status); 
      return;
    }
    
    this.ps = spawn(this.exe, this.variables, {cwd: self.config.path});
    this.output = this.ps.stdout;
    self.status = STARTING;

    this.output.on('data', function(data){
      output = data.toString();
      console.log(output);
      self.emit('console', output);
      
      if (self.status == STARTING){
	if (output.indexOf(self.plugin.started_trigger) !=-1){
	  this.status = ON;
	  console.log("Server started");
	  self.queryCheck = setInterval(self.plugin.query, 15000, self)
          self.emit('started');
	}
      };
      
    });
    
    this.ps.on('exit', function(){
      if (self.status == STOPPING){
	console.log("Process stopped");
	self.status = OFF;
	self.emit('off');
        return;	
      }
     
      if (self.status == ON || self.status == STARTING){
	    console.log("Process died a horrible death");
  	    self.status = OFF;
        self.emit('crash');
      }

    });
    
    this.on('crash', function(){
      console.log("Restarting after crash");
      self.restart();
    });
}

GameServer.prototype.turnoff = function(){
  clearTimeout(self.queryCheck);
  if (!this.status == OFF){
    self.status = STOPPING; 
    this.kill();
  }else{
    self.emit('off');
  }
}


GameServer.prototype.query = function(){
  return self.plugin.query()
}

GameServer.prototype.lastquery = function(){
  return {"motd":self.hostname, "numplayers":self.numplayers, "maxplayers":self.maxplayers, "lastquery":self.lastquerytime}
}

GameServer.prototype.configlist = function(){
  return self.plugin.configlist(self);
}

GameServer.prototype.maplist = function(){
  return self.plugin.maplist(self);
}

GameServer.prototype.info = function(){
  return {"query":self.lastquery(), "config":self.config, "status":self.status}
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

GameServer.prototype.console = function Console(){

}

GameServer.prototype.console.broadcast = function(data) {
    for(var i in this.clients){
        this.clients[i].send(data);
    }
};


module.exports = GameServer;