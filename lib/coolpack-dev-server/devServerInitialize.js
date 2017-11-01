
var cache=require("./cache");

function devServerInitialize(initConfig,initStore){
   cache.config=initConfig;
   cache.store=initStore;  
}

module.exports=devServerInitialize;