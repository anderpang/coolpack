const xpath=require("./xpath");
const ReportSys=require("./ReportSys");
const config=require("./config");
const utils=require("./utils");
const devServer=require("../coolpack-dev-server/server");
const sockets=require("../coolpack-dev-server/cache").sockets;

const store={
    startTime:Date.now(),
    jsModules:{},     //{filename:Moudle,filename2:Module2}
    cssModules:{},    //{filename:Moudle,filename2:Module2}
    htmlModules:{},   //{"index":Module,filename:Moudle,filename2:Module2}
    copyFileList:{}, 
    createModuleList:{},   //生成文件列表，以仿各目录重复生成
    base64FileList:{},

    jsNetRequestMap:{},  //js net request
    cssNetRequestMap:{}, //css net request

    registers:{},    //{moduleIndex:register}
    alias:{},        //{"jquery":moduleId}
    moduleIndex:0,
    htmlModuleIndex:0,
    _isHotUpdate:false,
    scriptBlock:new ReportSys()
};

store.scriptBlock.complete=function(){
    console.log("Time:\x1b[1m",(Date.now()-store.startTime)+"\x1b[0mms");
    utils.showInfo("coolpack:","Compiled successfully!");
    
    if(store._isHotUpdate){
        var isCssModule=!!store._updateModule,           
            buffer;
            
            if(isCssModule){
                buffer=getSocketMessage("css","",getCssReferredModule());
            }
            else{
                buffer=getSocketMessage("reload","","");
            }

        sockets.forEach(function(conn){
            conn.push(buffer);
        }); 
        return;
    }
    if(config._isDevServer){
        store._isHotUpdate=true;
        devServer.start(config,store);
    }
};

store.reset=function(){
    this.startTime=Date.now();
};

function getSocketMessage(type,message,data){
    return new Buffer(JSON.stringify({
        "type":type,
        "message":message,
        "data":data
      }));
}

function getCssReferredModule(){
    var cssModule=store._updateModule,
        jsModuleNames=cssModule.referredModuleFileNames,
        i=jsModuleNames.length,
        jsModules=store.jsModules,
        moduleIds=[],
        isFile,
        ezm;

       if(!cssModule)return moduleIds;

    
       while(i--){
           ezm=jsModules[jsModuleNames[i]];
           if(ezm){
               isFile=!!ezm._cssFileName;
              moduleIds.push({
                  "id":ezm.moduleIndex,
                  "isFile":isFile,
                  "data":isFile?xpath.basename(ezm._cssFileName):ezm.__css
              });
           }
       }
       
       return moduleIds;
}

module.exports=store;