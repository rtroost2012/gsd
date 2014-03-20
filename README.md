Game Server Daemon
=========


Created by [GameTainers], Game Server Daemon is an open source API witten in Nodejs to easily manage your game servers with a RESTful api.

  - Turn on/off/restart servers
  - Query and monitor for crashes
  - Edit and create files
  - Install and Uninstall game modes
  - Console output via socket.io

Installation
----

These instructions are for ubuntu, but should work on any system.

First lets install NodeJS and the required packages
```sh
sudo add-apt-repository ppa:chris-lea/node.js
apt-get update
apt-get install nodejs make g++ git
```
Clone GSD
```sh
git clone https://github.com/gametainers/gsd.git
```
Download the required nodejs packages
```sh
cd gsd
npm install
npm start
```
Configure the supplied config.json file with your server information.

Use
-----------
You can use the Game Server Daemon API : [Api Documentation]

The GameTainers panel : [GameTainers panel]

PufferPanel : [Pufferpanel]

[GameTainers]:http://gametainers.com/
[Api Documentation]:http://gametainers.com/static/api/daemon/dist/
[GameTainers panel]:https://github.com/gametainers/panel
[Pufferpanel]:https://github.com/DaneEveritt/PufferPanel
