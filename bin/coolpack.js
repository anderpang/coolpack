#!/usr/bin/env node

const fs=require("fs");
const path=require("path");

const packageConfig=require("../package.json");

var argv = require("yargs")
	.usage("coolpack "+packageConfig.version+"\n"+
		"Usage with config file: coolpack")
    .example("coolpack --config ./config/coolpack.config.js")
    .help("help")
    .alias("help", "h")
    .alias("version", "v")
    //.version("v",packageConfig.version)
    .options({
        "config": {
            type: "string",
            alias:"c",
            describe: "Path to the config file",
            "default":"coolpack.config.js",
            defaultDescription: "coolpack.config.js"
        },
        "watch": {
            type: "boolean",
            alias: "w",
            describe: "Watch the filesystem for changes"
        },
        "minify": {
            type: "boolean",
            alias:"m",
            "default":true,
            describe: "Compressed JS"
        },
        "server":{
            type: "boolean",
            alias:"s",
            describe:"Start the development server"            
        },        
        "host": {
            type: "string",
            "default": "localhost",
            describe: "The hostname/ip address the server will bind to"
        },
        "port": {
            type: "string",
            "default": "8181",
            describe: "The port"
        },
        "hot": {
            type: "boolean",
            "default":true,
            describe: "Enables Hot Module Replacement",
        }
    }).argv;

    var configFile=argv.config,
        coolpack=require("../lib/coolpack/");
    if(configFile)
    {
       
         configFile=path.join(process.cwd(),configFile);
         
        if(!fs.existsSync(configFile))       
        {
           console.log(" Error: A configuration file could be named 'coolpack.config.js' in the current directory.");
           return;
        }
        if(configFile){
            var customConfig=require(configFile),
                devServer=customConfig.devServer||(customConfig.devServer={});
            
            argv.hot=argv.server&&argv.hot;  //必须启动服务器才生效

            customConfig._version=packageConfig.version;
            customConfig.watch=argv.watch||argv.hot||customConfig.watch;
            customConfig.minify=argv.minify;
            customConfig._isDevServer=argv.server;

            devServer.host=argv.host;
            devServer.port=argv.port;
            devServer.hot =argv.hot;

            coolpack(customConfig);
        }
    }