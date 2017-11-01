const xfs=require("fs-extra");

const xpath=require("./xpath");
const config=require("./config");
const store=require("./store");

function createScriptFile(pack_code,output,blockId){
    var jsPath=typeof output==="string"&&output?output:"chunk-"+blockId+".js";

        jsPath=xpath.join(config.outputPath,config.hash,jsPath);

        if(store.createModuleList.hasOwnProperty(jsPath))
        {
            return jsPath;
        }

        store.createModuleList[jsPath]=true;

       if(config._isDevServer)
       {
          store.jsNetRequestMap[jsPath]=pack_code;
       }
       else
       {
          xfs.outputFileSync(jsPath, pack_code);
       }

    return jsPath;
}

module.exports=createScriptFile;

