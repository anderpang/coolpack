const watch=require("watch");

const config=require("./config");
const utils=require("./utils");
const EasyModule=require("./EasyModule");
const CssModule=require("./CssModule");
const hotUpdate=require("./hotUpdate");

function watching(callback){
    var timer,watchOptions;

    if(!config.watch)return;

    watchOptions=config.watchOptions;
    if(!watchOptions){
        watchOptions=config.watchOptions={interval:5};
    }

    console.log("coolpack is watching the files…");

    if(!watchOptions.hasOwnProperty("ignoreDirectoryPattern")){
       watchOptions.ignoreDirectoryPattern=new RegExp("^"+config.outputPath.split("\\").join("\\\\")+"|\\bnode_modules\\b");
    }
  
    watch.createMonitor(config.context,watchOptions, function (monitor){
        monitor.on("created", function (f, stat) {
            if(f.startsWith(config.outputPath))return;
            console.log(f + " created");
            hotUpdate("created",f);
        });
        monitor.on("changed", function (f, curr, prev) {
            console.log(f + " changed");
            hotUpdate("change",f);
        });
        monitor.on("removed", function (f, stat) {
            console.log(f + " removed");
            hotUpdate("removed",f);
        });
    });
}


module.exports=watching;