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
var exec = require('child_process').exec;
var createUser = require("./create.js").createUser;
var deleteUser = require("./create.js").deleteUser;
var fixperms = require("./create.js").fixperms;

var async = require('async');


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
    if (!this.status == OFF){
      // console.log("Tried to turn on but status is already : " + self.status); 
      return;
    }
    
    this.ps = pty.spawn(this.exe, this.variables, {cwd: this.config.path});

    this.setStatus(STARTING);
    
    this.pid = this.ps.pid

      this.ps.on('data', function(data){
	output = data.toString();
	console.log(output);
	this.emit('console', output);
	
	if (this.status == STARTING){
	  if (output.indexOf(this.plugin.started_trigger) !=-1){
	    this.setStatus(ON);
	    console.log("Server started");
	    this.queryCheck = setInterval(this.plugin.query, 15000, this);
	    this.statCheck = setInterval(this.procStats, 10000);
	    this.procStats.usage = {};
	    this.emit('started');
	  }
	};
	
      });
      
      this.ps.on('exit', function(){
	if (this.status == STOPPING){
	  console.log("Process stopped");
	  this.setStatus(OFF);
	  this.emit('off');
	  return;	
	}
      
	if (this.status == ON || this.status == STARTING){
	  console.log("Process died a horrible death");
	  this.setStatus(OFF);
	  this.emit('off');
	  this.emit('crash');
	}

      });

      this.on('crash', function(){
	console.log("Restarting after crash");
	this.restart();
      });
      
      this.on('off', function clearup(){
	clearInterval(this.queryCheck);
	clearInterval(this.statCheck);
	this.procStats.usage = {};
	usage.clearHistory(this.pid);
	this.pid = undefined;
      })
	

}

GameServer.prototype.turnoff = function(){
  clearTimeout(this.queryCheck);
  if (!this.status == OFF){
    this.setStatus(STOPPING); 
    this.kill();
  }else{
    this.emit('off');
  }
}

GameServer.prototype.create = function(){
  var config = this.config;
  var _this = this;
  
  async.series([
    function(callback) {
      createUser(config.user, config.path, function cb(){callback(null);});
    },
    function(callback) {
      _this.plugin.install(_this, function cb(){callback(null);});
    },
    function(callback) {
      fixperms(_this);
      callback(null); 
    }    
  ]);
}

GameServer.prototype.delete = function(){
  deleteUser(this.config.user);
}

GameServer.prototype.setStatus = function(status){
  this.status = status
  this.emit('statuschange');
  return this.status;  
}


GameServer.prototype.query = function(){
  return this.plugin.query()
}

GameServer.prototype.procStats = function(){
  usage.lookup(this.pid, {keepHistory: true}, function(err, result) {
    // TODO : Return as % of os.totalmem() (optional)
    // TODO : Return as % of ram max setting
    
    this.procStats.usage = result;
  });
}

GameServer.prototype.lastquery = function(){
  return {"motd":this.hostname, "numplayers":this.numplayers, "maxplayers":this.maxplayers, "lastquery":this.lastquerytime, "map":this.map, "players":this.players}
}

GameServer.prototype.configlist = function(){
  return this.plugin.configlist(this);
}

GameServer.prototype.maplist = function(){
  return this.plugin.maplist(this);
}

GameServer.prototype.addonlist = function(){
  return this.plugin.addonlist(this);
}
GameServer.prototype.info = function(){
  return {"query":this.lastquery(), "config":this.config, "status":this.status, "pid":this.pid, "process":this.procStats.usage, "variables":this.variables}
}


GameServer.prototype.restart = function(){
  this.once('off', function (stream) {this.turnon()});
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
  file = pathlib.join(this.config.path, pathlib.normalize(f));
  return fs.readFileSync(file, "utf8");
}

GameServer.prototype.writefile = function writefile(f, contents){
  file = pathlib.join(this.config.path, pathlib.normalize(f));
  fs.writeFile(file, contents);
}

GameServer.prototype.downloadfile = function downloadfile(url, path){
    path = pathlib.join(this.config.path, pathlib.normalize(path));
   
    //TODO : Work out when to extract (zip etc...) , { extract: true }
    download(url, path);
    return 'ok';
}
 

GameServer.prototype.deletefile = function Console(){

}

GameServer.prototype.getgamemodes = function getgamemode(res){
  managerlocation = pathlib.join(__dirname,"gamemodes",this.config.plugin,"gamemodemanager");
  child = exec(managerlocation + ' getlist',
  function (error, stdout, stderr) {
    res.send(JSON.parse(stdout));
  });
}

GameServer.prototype.installgamemode = function installgamemode(){
  managerlocation = pathlib.join(__dirname,"gamemodes",this.config.plugin,"gamemodemanager");
  if (this.status == ON){
    this.turnoff();
    console.log("HERE");
  }
  this.setStatus(CHANGING_GAMEMODE);
  console.log(this.config.path)
  installer = spawn(managerlocation, ["install", "craftbukkit", this.config.path], {cwd: this.config.path});
  
  console.log(managerlocation);
  
  installer.stdout.on('data', function(data){
    if (data == "\r\n"){return}
    console.log(data);
    this.emit('console',data);
  });
      
  installer.on('exit', function(){
    this.setStatus(OFF);
  });
}

GameServer.prototype.removegamemode = function Console(){
  this.ps = spawn(this.exe, [this.config.path], {cwd: this.config.path});
}
module.exports = GameServer;