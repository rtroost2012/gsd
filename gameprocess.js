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
var getIPAddress = require("./utls.js").getIPAddress;

var async = require('async');


var OFF = 0; ON = 1, STARTING = 2, STOPPING = 3; CHANGING_GAMEMODE = 4;

function GameServer(config) {
  this.status = OFF;
  this.config = config;
  this.joined = ["-Xmx", "-XX:PermSize=", "-Djline.terminal="];
  this.plugin = plugins[this.config.plugin + '.js'];
  this.variables = merge(this.joined, this.plugin.defaultvariables, this.config.variables);
  this.exe = this.plugin.exe;
  
  if ('gameport' in this.config || this.config.gameport != 0){
    this.gameport = this.config.gameport
  }else{
    this.gameport = this.plugin.settings.defaultPort;
  }

  if ('gamehost' in this.config || this.config.gamehost != ""){
    this.gamehost = this.config.gamehost
  }else{
    this.gamehost = getIPAddress();
  }
  
};

util.inherits(GameServer, events.EventEmitter);


GameServer.prototype.turnon = function(){
    var self = this;
    
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
      self.emit("console", output);
      if (self.status == STARTING){
	if (output.indexOf(self.plugin.started_trigger) !=-1){
	  self.setStatus(ON);
	  console.log("Server started");
	  self.queryCheck = setInterval(self.plugin.query, 15000, self);
	  self.statCheck = setInterval(self.procStats, 10000, self);
	  self.usagestats = {};
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
      self.usagestats = {};
      usage.clearHistory(self.pid);
      self.pid = undefined;
    });
}

GameServer.prototype.turnoff = function(){
  var self = this;
  clearTimeout(self.queryCheck);
  if (!self.status == OFF){
    self.setStatus(STOPPING); 
    self.kill();
  }else{
    self.emit('off');
  }
}

GameServer.prototype.create = function(){
  var config = this.config;
  var self = this;
  
  async.series([
    function(callback) {
      createUser(config.user, config.path, function cb(){callback(null);});
    },
    function(callback) {
      self.plugin.install(self, function cb(){callback(null);});
    },
    function(callback) {
      fixperms(self);
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

GameServer.prototype.procStats = function(self){
  usage.lookup(self.pid, {keepHistory: true}, function(err, result) {
    // TODO : Return as % of os.totalmem() (optional)
    // TODO : Return as % of ram max setting

    self.usagestats = result;
    console.log(result);
    console.log(self.usagestats);
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
  return {"query":this.lastquery(), "config":this.config, "status":this.status, "pid":this.pid, "process":this.usagestats, "variables":this.variables}
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
  self.ps = spawn(self.exe, [self.config.path], {cwd: self.config.path});
}
module.exports = GameServer;