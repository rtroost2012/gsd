var exec = require('child_process').exec;
var async = require('async');
var pathlib = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var format = require('util').format;
var executeCommand = require('../utls').executeCommand;

function createUser(username, home, callback){
    callback();
}

function deleteUser(username){}

function linkDir(from_path, to_path, callback){
    callback();
}

function fixperms(gameserver){}

function replaceFiles(base_folder, files, backing_folder, callback){
    callback();
}

function symlinkFolder(gameserver, from_path, replacements, parentcallback){
    parentcallback();
}

function copyFolder(gameserver, from_path, parentcallback){
    parentcallback();
}

exports.copyFolder = copyFolder;
exports.symlinkFolder = symlinkFolder;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.linkDir = linkDir;