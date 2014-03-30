var config = require('./config.json');
var restify = require('restify');

// This is very very simple auth to be replaced later with something like username / password http auth, oauth or jwt, feel free to do so !

function authenticate(req, res, next) {
    //
    if (!('X-Access-Token' in req.headers)){
      console.log('not authenticated, missing header');
      return next(restify.NotAuthorizedError());
    }
       
    token = req.headers['X-Access-Token']
       
    if (config.tokens.indexOf(token) > -1){
      return next();
    }else{
      console.log('not authenticated, wrong auth');      
      return next(restify.NotAuthorizedError());
    }
}

exports.authenticate = authenticate;