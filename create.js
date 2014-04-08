var exec = require('child_process').exec;
var async = require('async');
var pathlib = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;

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


function linkDir(from_path, to_path, callback){
  exec("cp -s -u -R {0}/* {1}".format(from_path, to_path),
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
      callback();
  });
}

function replaceFiles(base_folder, files, backing_folder, callback){
  finalfiles = [];
  
  files.forEach(function(file) {
    isWildcard = (file.indexOf("*") != -1);
    if (isWildcard == true){
      glob(file, {'cwd':base_folder, 'sync':true}, function (er, files) {
	finalfiles = finalfiles.concat(files);
      });
    };
  })
  
  async.each(finalfiles, function( file, icallback) {
      var fileTo = pathlib.join(base_folder, file);
      var fileFrom = pathlib.join(backing_folder, file);
      
      fs.exists(fileTo, function (exists) {
	if (exists){
	  fs.unlink(fileTo, function(err){
	    if (err) icallback();
	    ncp(fileFrom, fileTo, function(err){
		if (err) throw err;
		console.log('success!');
		icallback();
	      });
	  });
	  
	}else{
	  icallback();
	}
      });
  }, function(err){
      // if any of the saves produced an error, err would equal that error
      if( err ) {
	// One of the iterations produced an error.
	// All processing will now stop.
	console.log('A file failed to process');
      } else {
	console.log('All files have been processed successfully');
      }
  });
  callback();
}

function easy_install(gameserver, from_path, replacements, parentcallback){
  
  async.series([
    function(callback) {
      linkDir(from_path, gameserver.config.path, function(){callback(null)});
       
    },
    function(callback) {
      replaceFiles(gameserver.config.path, replacements, from_path, function cb(){callback(null); });
    }
    
  ], function(err, results){parentcallback();});
}

function fixperms(gameserver){
  exec('find {0} -type d -exec chown {1} {} \\;'.format(gameserver.config.path, gameserver.config.user),
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
  });
  exec('find {0} -type f -exec chown {1} {} \\;'.format(gameserver.config.path, gameserver.config.user),
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
  }); 
};

exports.fixperms = fixperms;
exports.easy_install = easy_install;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.linkDir = linkDir;