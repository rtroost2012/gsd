var spawn = require('child_process').spawn;
var pty = require('pty.js');
var util = require("util");
var events = require("events");
var plugins = require("./plugins.js").plugins;
var merge = require("./utls.js").merge;
var download = require('download');
var usage = require('usage');
var pathlib = require('path');
var fs = require('fs');
var exec = require('child_process').exec

var OFF = 0; ON = 1, STARTING = 2, STOPPING = 3; CHANGING_GAMEMODE = 4;

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
      // console.log("Tried to turn on but status is already : " + self.status); 
      return;
    }
    
    this.ps = pty.spawn(this.exe, this.variables, {cwd: self.config.path});

    self.setStatus(STARTING);
    console.log(self.status);
    
    self.pid = this.ps.pid

      this.ps.on('data', function(data){
	output = data.toString();
	console.log(output);
	self.emit('console', output);
	
	if (self.status == STARTING){
	  if (output.indexOf(self.plugin.started_trigger) !=-1){
	    self.setStatus(ON);
	    console.log("Server started");
	    self.queryCheck = setInterval(self.plugin.query, 15000, self);
	    self.statCheck = setInterval(self.procStats, 10000, self);
	    self.procStats.usage = {};
	    self.emit('started');
	  }
	};
	
      });
      
      this.ps.on('exit', function(){
	if (self.status == STOPPING){
	  console.log("Process stopped");
	  self.setStatus(OFF);
	  self.emit('off');
	  return;	
	}
      
	if (self.status == ON || self.status == STARTING){
	  console.log("Process died a horrible death");
	  self.setStatus(OFF);
	  self.emit('off');
	  self.emit('crash');
	}

      });

      this.on('crash', function(){
	console.log("Restarting after crash");
	self.restart();
      });
      
      this.on('off', function clearup(){
	clearInterval(self.queryCheck);
	clearInterval(self.statCheck);
	self.procStats.usage = {};
	usage.clearHistory(self.pid);
	self.pid = undefined;
      })
	

}

GameServer.prototype.turnoff = function(){
  clearTimeout(self.queryCheck);
  if (!this.status == OFF){
    self.setStatus(STOPPING); 
    this.kill();
  }else{
    self.emit('off');
  }
}

GameServer.prototype.setStatus = function(status){
  self.status = status
  self.emit('statuschange');
  return self.status;  
}


GameServer.prototype.query = function(){
  return self.plugin.query()
}

GameServer.prototype.procStats = function(self){
  usage.lookup(self.pid, {keepHistory: true}, function(err, result) {
    // TODO : Return as % of os.totalmem() (optional)
    // TODO : Return as % of ram max setting
    
    self.procStats.usage = result;
  });
}

GameServer.prototype.lastquery = function(){
  return {"motd":self.hostname, "numplayers":self.numplayers, "maxplayers":self.maxplayers, "lastquery":self.lastquerytime, "map":self.map, "players":self.players}
}

GameServer.prototype.configlist = function(){
  return self.plugin.configlist(self);
}

GameServer.prototype.maplist = function(){
  return self.plugin.maplist(self);
}

GameServer.prototype.addonlist = function(){
  return self.plugin.addonlist(self);
}
GameServer.prototype.info = function(){
  return {"query":self.lastquery(), "config":self.config, "status":self.status, "pid":self.pid, "process":self.procStats.usage}
}


GameServer.prototype.restart = function(){
  self.once('off', function (stream) {self.turnon()});
  this.turnoff();
}

GameServer.prototype.kill = function(){
    this.ps.kill();
}

GameServer.prototype.send = function(data){
  console.log(data);
  this.ps.write(data + '\n');
}

GameServer.prototype.console = function Console(){

}


GameServer.prototype.readfile = function readfile(f){
  file = pathlib.join(self.config.path, pathlib.normalize(f));
  return fs.readFileSync(file, "utf8");
}

GameServer.prototype.writefile = function writefile(f, contents){
  file = pathlib.join(self.config.path, pathlib.normalize(f));
  fs.writeFile(file, contents);
}

GameServer.prototype.downloadfile = function downloadfile(url, path){
    path = pathlib.join(self.config.path, pathlib.normalize(path));
   
    //TODO : Work out when to extract (zip etc...) , { extract: true }
    download(url, path);
    return 'ok';
}


GameServer.prototype.deletefile = function Console(){

}

GameServer.prototype.getgamemodes = function getgamemode(res){
  managerlocation = pathlib.join(__dirname,"gamemodes",self.config.plugin,"gamemodemanager");
  child = exec(managerlocation + ' getlist',
  function (error, stdout, stderr) {
    res.send(JSON.parse(stdout));
  });
}

GameServer.prototype.installgamemode = function installgamemode(){
  managerlocation = pathlib.join(__dirname,"gamemodes",self.config.plugin,"gamemodemanager");
  if (self.status == ON){
    self.turnoff();
    console.log("HERE");
  }
  self.setStatus(CHANGING_GAMEMODE);
  console.log(self.config.path)
  installer = spawn(managerlocation, ["install", "craftbukkit", self.config.path], {cwd: self.config.path});
  
  console.log(managerlocation);
  
  installer.stdout.on('data', function(data){
    if (data == "\r\n"){return}
    console.log(data);
    self.emit('console',data);
  });
      
  installer.on('exit', function(){
    self.setStatus(OFF);
  });
}

GameServer.prototype.removegamemode = function Console(){
  this.ps = spawn(this.exe, [self.config.path], {cwd: self.config.path});
}
module.exports = GameServer;