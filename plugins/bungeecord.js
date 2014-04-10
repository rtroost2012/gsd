mc = require('./minecraft');
fs = require('fs');
pathlib = require('path');
glob = require("glob")

var settings = {};
settings.name = "Bungeecord"
settings.stop_command = 'end'
settings.started_trigger = '[INFO] Listening on'
settings.defaultvariables = {"-Xmx":"256M", "-jar":"BungeeCord.jar"}
settings.exe = "java",

settings.query = mc.query;


settings.maplist = function maplist(self){
    maps = [];
    return maps;
};

settings.configlist = function configlist(self){
  var configs = {};
  configs['core'] = [];
  
  glob("*.yml", {'cwd':self.config.path, 'sync':true}, function (er, files) {
    configs['core'] = configs['core'].concat(files);
  });
  
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
