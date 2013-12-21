var config = {};


config.process = {};
config.server = {};

config.process.listen_port = 8001;
config.process.console_port = 8002;
config.process.events_port = 8003;

// config.server.command_line = "java -Xmx {{Xmx}} -jar minecraft.jar";
config.server.command_line = "./count.sh";
config.server.path = "./";
config.server.variables = {"Xmx":"512Mb"};
config.server.port = 25565;
config.server.plugin = "minecraft";

module.exports = config;
