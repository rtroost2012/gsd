var restify = require('restify');
var exec = require('child_process').exec;

function executeCommand(command, callback){
  exec(command,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
	console.log('exec error: ' + error);
      }
      callback();
  });  
}

function merge(joined, target) {
    var sources = [].slice.call(arguments, 2);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    
    output = [];
    for (var key in target) {
      if (joined.indexOf(key)==-1){	
	output.push(key,target[key]);	
      }else{
	output.push(key + target[key]);
      }

    }

    output = output.filter(function(n){return n});

    console.log(output);
    return output;
}

function saveconfig(config){
  fs.writeFile("config.json", JSON.stringify(config, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
  }); 
}

function unknownMethodHandler(req, res) {
  if (req.method.toLowerCase() === 'options') {
    console.log('received an options method request');
    var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With', 'Options', 'X-Access-Token']; // added Origin & X-Requested-With

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', res.methods.join(', '));
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    return res.send(204);
  }
  else
    return res.send(new restify.MethodNotAllowedError());
}

exports.executeCommand = executeCommand;
exports.saveconfig = saveconfig;
exports.merge = merge;
exports.unknownMethodHandler = unknownMethodHandler;