const xfs=require("fs-extra");

const config=require("./config");
const store=require("./store");
const xpath=require("./xpath");

function createFirstCss(easyModule,filename,blockId){
    var css,relateUrl;
     if(!filename)filename="style-"+blockId+".css";
     if(config.extractFirstCss!==false)
    { 
       filename=xpath.join(config.outputPath,config.hash,filename);
       css=easyModule.getFileCss(filename);              

       if(config._isDevServer){
          store.cssNetRequestMap[filename]=css;
       }
       else
       { 
          xfs.outputFileSync(filename,css);
       }

       return filename;
       
    }

    return null;    
}

module.exports=createFirstCss;

