const fs=require("fs");
const postcss=require("postcss");
const CleanCSS = require('clean-css');

const config=require("./config");
const store=require("./store");
const EasyWriter=require("./EasyWriter");
const xpath=require("./xpath");
const easyFileCopy=require("./easy-file-copy");
const fileToBase64=require("./fileToBase64");

const commentRegExp =/\/\*.*?\*\//g;
const urlRegExp = /(?:(?:@import\s+)?url\s*\(\s*(['"]?))(.*?)(?:\1\s*\))|(?:@import\s+(['"]?))([^\3]+)/ig;
const newCleanCSS=new CleanCSS({});

/**
 * filename:绝对路径
 * outputname:导出路径（打在包里的就没有null，独立的css才有)
 * referredModuleFileName:引用css的js文件名
 * callback:回调
 * */
function CssModule(filename,outputname,referredModuleFileName,callback){
    var _this=store.cssModules[filename];
    if(_this)
    {
       if(!outputname&&_this.referredModuleFileNames.indexOf(referredModuleFileName)===-1){
           _this.referredModuleFileNames.push(referredModuleFileName);
       }

       if(_this.loaded){
          callback&&callback();
       }
       else
       {       
           callback&&_this.callbacks.push(callback);
       }
       return _this;
    }

    this.type="css";
    this.filename=filename; //绝对路径
    this.outputname=outputname;
    this.referredModuleFileNames=[referredModuleFileName];
    this.callbacks=[];
    callback&&this.callbacks.push(callback);

    store.cssModules[filename]=this;

    this.read();
 
}
CssModule.prototype.read=function(){
     var ew=new EasyWriter(),
         _this=this;

        this.loaded=false;
        ew.on("finish",function(){
              _this.parse(this.toString());
        }).inputFile(this.filename);
};

CssModule.prototype.parse=function(css){
   if(typeof config.cssSyntax==="function")
   {
       config.cssSyntax(css,this.dispose.bind(this));
   }
   else
   {
       this.dispose(null,css);
   }
};

CssModule.prototype.dispose=function(err,css){
    var _this=this,
       plugins=config.postcssPlugins,
       rules=config.rules.css;

       if(err){
           console.log(err);
       }

       if(typeof css==="object"){
           css=css.css;
       }

       rules.forEach(function(f){
           css=f(css);
       });

    //插件处理
    postcss(plugins)
    .process(css)
    .then(function(result){
        var callbacks=_this.callbacks,
            i=callbacks.length,
            css=result.css,
            cssList;

            if(config.minify){
                css=newCleanCSS.minify(css).styles;
            }

            css=css.replace(commentRegExp,'');

            cssList=_this.urlRewrite(css);

           _this.exports=cssList;

           if(_this.ouputname){
              xfs.outputFileSync(_this.outputname,_this.getRelativePathCss(_this.outputname));
           }

           while(i--){
              callbacks[i](cssList);
           }

           callbacks.length=0;
           _this.loaded=true;
    });
};

CssModule.prototype.urlRewrite=function(css){

    var _this=this,
        matchUrl,
        abspath,
        filename=this.filename,
        isAlone=!!this.outputname,
        dirname=xpath.dirname(filename),
        outputPath=isAlone?xpath.dirname(this.outputname):xpath.join(config.outputPath,config.hash,xpath.relative(config.context,xpath.dirname(filename))),
        writeUrl,
        cssList=[],
        urlRight="",
        tmp,
        len=css.length,
        $match,
        $left,
        $right,
        isConvBase64;

        while(urlRegExp.test(css)){
            matchUrl = RegExp['$2'] || RegExp['$4'];

            if (matchUrl&&!matchUrl.startsWith("data:")&&!matchUrl.startsWith("http://")&&!matchUrl.startsWith("https://")&&!matchUrl.startsWith("//")){
                abspath=xpath.join(dirname,matchUrl);
                $match=RegExp['$&'];
                $left=RegExp['$`'];
                $right=RegExp["$'"];
                isConvBase64=false;
             
                if($match.startsWith("@import "))
                {
                    writeUrl=xpath.join(outputPath,matchUrl);
                    new _this.constructor(xpath.join(dirname,matchUrl),writeUrl,null);
                } 
                else
                { 
                    if(config.cssFileLimit===0||fs.statSync(abspath).size>config.cssFileLimit)
                    {    
                         writeUrl=easyFileCopy(abspath,xpath.join(outputPath,matchUrl));
                    }
                    else
                    {
                         writeUrl=fileToBase64(abspath);
                         isConvBase64=true;
                    }
                }
                  
                  tmp=$match.split(matchUrl);

                if(isConvBase64){
                   cssList.push(urlRight+$left+tmp[0]+writeUrl+tmp[1]);
                   urlRight="";
                }
                else
                {
                  cssList.push(urlRight+$left+tmp[0]);
                  cssList.push([writeUrl]);
                  urlRight=tmp[1];                  
                }

                css=$right;
            }
        }

        cssList.push(urlRight+css);

        return cssList;
};

CssModule.prototype.update=function(callback){
      var referredModuleFileNames=this.referredModuleFileNames,
          jsModules=store.jsModules,
          updateCallback=function(){
       
             var i=referredModuleFileNames.length,
                 ezm;
             while(i--){
                 ezm=jsModules[referredModuleFileNames[i]];
                 if(ezm)
                 {
                   ezm.combineCss();
                   ezm.wrap();
                 }
             }

             callback&&callback();
          };
      
        this.callbacks.push(updateCallback);
        this.read();
};

CssModule.prototype.getRelativePathCss=function(filepath){
    var cssList=this.exports,
        i=0,
        ii=cssList.length,
        item,
        css="";

        for(;i<ii;i++){
           item=cssList[i];
           if(typeof item==="string"){
               css+=item;
           }
           else
           {
               css+=xpath.getUrlRelative(filepath,item[0]);
           }
        }

        return css;
};

CssModule.prototype.getUnstablePathCss=function(){
    var cssList=this.exports,
        i=0,
        ii=cssList.length,
        item,
        outputPath=config.outputPath,
        css="";

        for(;i<ii;i++){
           item=cssList[i];
           if(typeof item==="string"){
               css+="css+=";
               css+=JSON.stringify(item);
           }
           else
           {
               css+="css+=path;";
               css+="css+=";
               css+=JSON.stringify("/"+xpath.getUrlRelative(outputPath,item[0]));               
           }
           css+=";";
        }

        return css;
};

module.exports=CssModule;