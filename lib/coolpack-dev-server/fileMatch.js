const fs=require("fs");

const cache=require("./cache");
const xpath=require("../coolpack/xpath");
const EasyReader=require("../coolpack/EasyReader");

const fileMatch={
    html:function(res,pathname,headers){
        var config=cache.config,
            store=cache.store,
            abspath=xpath.join(config.templatePath,pathname),
            theModule=store.htmlModules[abspath];

            if(theModule){
                res.writeHead(200,headers);
                res.end(theModule.exports);
                return true;
            }

          return this.readFile(res,abspath,headers);
    },

    js:function(res,pathname,headers){
        var config=cache.config,
            store=cache.store,
            abspath=xpath.join(config.outputPath,pathname),
            devFile="__coolpack__.js",
            code=store.jsNetRequestMap[abspath];

            if(code){
                res.writeHead(200,headers);
                res.end(code);
                return true;
            }

            if(xpath.basename(pathname)===devFile){
                code=store.jsNetRequestMap[devFile];
                res.writeHead(200,headers);
                res.end(code);
                return true;
            }

            abspath=xpath.join(config.context,pathname.replace("/"+config.hash,""));
            
           return this.readFile(res,abspath,headers);  
    },

    css:function(res,pathname,headers){
        var config=cache.config,
            store=cache.store,
            abspath=xpath.join(config.outputPath,pathname),
            code=store.cssNetRequestMap[abspath];

            if(code){
                res.writeHead(200,headers);
                res.end(code);
                return true;
            }            

           abspath=xpath.join(config.context,pathname.replace("/"+config.hash,""));
            
           return this.readFile(res,abspath,headers);    
    },

    others:function(res,pathname,headers){
       var config=cache.config,
            store=cache.store,
           abspath=xpath.join(config.context,pathname.replace("/"+config.hash,""));
            
           return this.readStreamFile(res,abspath,headers);    
    },

    readFile:function(res,filename,headers){
        if(fs.existsSync(filename)){
            new EasyReader(filename).then(function(code){
                    res.writeHead(200,headers);
                    res.end(code);

            },function(){
                res.writeHead(404,headers);
                res.end();
            });
            return true;
        }  
        return false;    
    },

    readStreamFile:function(res,filename,headers){
        if(fs.existsSync(filename)){
             res.writeHead(200,headers);
            fs.createReadStream(filename).pipe(res).on("finish",function(){
                res.end();
            });
            return true;
        }

        return false;
    }
};

module.exports=fileMatch;