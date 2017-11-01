const http=require("http");
const url=require("url");
const mime=require("mime");
const open=require("opn");
const httpProxy = require("http-proxy");

const xpath=require("../coolpack/xpath");
const utils=require("../coolpack/utils");
const getHomePage=require("./getHomePage");
const fileMatch=require("./fileMatch");
const devServerInitialize=require("./devServerInitialize");
const EasySocket=require("./EasySocket");

var isStart=false;

exports.start=function(initConfig,initStore){
    if(!initConfig._isDevServer||isStart)return;
    
    var devServer=initConfig.devServer;
        proxy = httpProxy.createProxyServer();

      devServerInitialize(initConfig,initStore);

    http.createServer(function(req,res){
        var location=url.parse(req.url),
            pathname=location.pathname,
            extname=xpath.extname(pathname),
            proxyConfig=initConfig.proxy,
            headers={"Content-type":mime.getType(extname)||"text/html"};
        
        if(pathname==="/favicon.ico"){            
            headers['Content-Length']=0;
            headers['Cache-Control']='max-age=3600';  
            res.writeHead(200,headers);        
            res.end();
            return;
        }

        if(pathname==="/" || pathname==="/index.html"){
            res.writeHead(200,headers);
            res.write(getHomePage());
            res.end();
            return;
        }
        
        for(var pn in proxyConfig){
            if(pathname.startsWith(pn)){
                proxy.web(req,res,proxyConfig[pn]);
                return;
            }
        }

        if(!extname){
            if(pathname.slice(-1)!=="/")
            {
                pathname+="/";
            }
            pathname+="index.html";
            extname=".html";
        }

    
        switch(extname){
            case ".html":
                if(fileMatch.html(res,pathname,headers)){
                    return;
                }
            break;

            case ".js":
                if(fileMatch.js(res,pathname,headers)){
                    return;
                }
            break;
            case ".css":
                if(fileMatch.css(res,pathname,headers)){
                    return;
                }
            break;
            default:
                if(fileMatch.others(res,pathname,headers)){
                    return;
                }
            break;           

        }
        
        res.writeHead(400,headers);
        res.end();

    }).on('upgrade', function(req,socket){ 
        new EasySocket(socket,req);
    }).listen(devServer.port,devServer.host,function(err){
        if(err){
            utils.showError(err);
        }
        else
        {
            var url="http://"+devServer.host+":"+devServer.port;
            utils.showInfo("The development server is running at",url);
            open(url);           
        }
    });
};


