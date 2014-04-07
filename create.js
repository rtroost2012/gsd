var fs = require('fs');
var exec = require('child_process').exec;
var async = require('async');
 
String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};


function createUser(username, home, callback){
  // TODO : check if user exists first
  exec("useradd -m -d {0} -s /bin/bash -G exe {1}".format(home, username),
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
      callback();
  });
}

function deleteUser(username){
  // TODO : check if user exists first
  exec("deluser --remove-home {0}".format(username),
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
  });  
}


function linkDir(from_path, to_path){
  exec("cp -s -u -R {0}/* {1}".format(from_path, to_path),
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
  });
}

function replaceFiles(base_folder, files, backing_folder){
  
}

function easy_install(gameserver, from_path, replacements){
  async.series([
    function(callback) {
      linkDir(from_path, gameserver.config.path)
      callback(null); 
    }
  ]);
}

exports.easy_install = easy_install;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.linkDir = linkDir;