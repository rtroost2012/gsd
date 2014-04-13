mcping = require('mcquery');
fs = require('fs');
pathlib = require('path');
glob = require('glob')
symlinkFolder = require('../create.js').symlinkFolder;
var async = require('async');

var settings = {};
settings.name = "Minecraft"
settings.stop_command = 'stop'
settings.started_trigger = ')! For help, type "help" or "?"'
settings.defaultvariables = {"-Xmx":"512M", "-jar":"minecraft_server.jar", "-Djline.terminal=":"jline.UnsupportedTerminal"}
settings.exe = "java",
settings.defaultPort = 25565;

settings.query = function query(self){
  var query = new mcping(self.gamehost, self.gameport);
  var reqcount=2;
  
  query.connect( function(err){
    if(err){
      console.error("Couldn't query server, please check the IP / port are configured correctly and query is enabled");
      self.emit('crash');
    }
  else{
    query.full_stat(function(err, res){
        self.hostname = res['hostname'];	
        self.numplayers = res['numplayers'];
        self.maxplayers = res['maxplayers'];
	self.map        = res['map'];
	self.players    = res['player_'];
	self.lastquerytime = new Date().getTime();
      
    });
  }
})
  
};

settings.install = function(server, callback){
  copyFolder(server, "/mnt/MC/", function(){callback()});
}

settings.maplist = function maplist(self){
    maps = [];

    fs.readdirSync(self.config.path).forEach(function(directory){
      
      path = pathlib.join(self.config.path, directory); 
      
      if (fs.lstatSync(path).isDirectory()){
	if (fs.existsSync(pathlib.join(path, "level.dat"))){
	  maps.push(directory)
	}
      }
    });
    
    return maps;
};

settings.configlist = function configlist(self){
  var configs = {};
  configs['core'] = [];
  
  glob("*.txt", {'cwd':self.config.path, 'sync':true}, function (er, files) {
    configs['core'] = configs['core'].concat(files);
  });
  
  if (fs.existsSync(pathlib.join(self.config.path, "server.properties"))){
    configs['core'] = configs['core'].concat("server.properties")
  }
  
  if (fs.existsSync(pathlib.join(self.config.path, "plugins"))){
    glob("plugins/*/*.yml", {'cwd':self.config.path, 'sync':true}, function (er, files) {
      configs['plugins'] = files;
    });
  }
  
  return configs;
};

settings.addonlist = function addonlist(self){
  var addons = {};
  
  if (fs.existsSync(pathlib.join(self.config.path, "plugins"))){
    glob("plugins/*.jar", {'cwd':self.config.path, 'sync':true}, function (er, files) {
      addons['bukkit'] = files;
    });
  }
  
  return addons;
};

module.exports = settings;