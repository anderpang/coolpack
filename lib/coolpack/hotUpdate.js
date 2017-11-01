const xpath=require("./xpath");
const config=require("./config");
const createScriptBlock=require("./createScriptBlock");
const cache=require("../coolpack-dev-server/cache");

function hotUpdate(type,filename){
   if(!config._isDevServer||!config.devServer.hot)return;

   var ext=xpath.extname(filename),
       buffer,
       ezm;
   if(config.moduleExtname.indexOf(ext)!==-1)
   {    
      ezm=cache.store.jsModules[filename];
      if(ezm){
          cache.store.reset();
          cache.store._updateModule=null;
          ezm.update(function(){              
              createScriptBlock(config.module,{},[],0);
          });
      }
   }
   else if(config.cssExtname.indexOf(ext)!==-1)
   {
      ezm=cache.store.cssModules[filename];
      if(ezm){
          cache.store.reset();
          cache.store._updateModule=ezm;
          ezm.update(function(){   
              createScriptBlock(config.module,{},[],0);
          });
      }
   }

}

module.exports=hotUpdate;