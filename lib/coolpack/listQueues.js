const xpath=require("./xpath");
const config=require("./config");
const utils=require("./utils");
const store=require("./store");

var isFirstPrint=true;

function listQueues(manifest){
    var i=0,
        ii=manifest.length,
        item,
        context=config.context;

   if(isFirstPrint){
      isFirstPrint=false;
      utils.showInfo("Version: coolpack",config._version);
      utils.showInfo("Hash:",config.hash);      
   }
    utils.showDividingLine(50);
    for(;i<ii;i++)
    {
       item=manifest[i];
       if(item.isDev)continue;
       utils.showSuccess(xpath.getUrlRelative(context,item.path));
       console.log(" Size: \x1b[1m"+(item.size>1024?(item.size/1024).toFixed(3)+"\x1b[0mKB":item.size+"\x1b[0mB"));
    }
    utils.showDividingLine(50);    
}

module.exports=listQueues;

