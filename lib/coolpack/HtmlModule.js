
const xfs=require("fs-extra");
const HTMLParser = require('html-minifier/src/htmlparser').HTMLParser;
const minify = require('html-minifier').minify;

const config=require("./config");
const store=require("./store");
const xpath=require("./xpath");
const utils=require("./utils");
const EasyReader=require("./EasyReader");
const easyFileCopy=require("./easy-file-copy");

//template:文件相对templatePath路径
function HtmlModule(template,inject,manifest){
    var filename=typeof template==="string"?template:null;
    this.type="html";
    this.moduleIndex=store.htmlModuleIndex++;
    this.inject=inject==="head"?"head":"body";
    this.outputname=xpath.join(config.outputPath,filename||"index.html");
    this.outputPath=xpath.dirname(this.outputname);
    this.makeJsCss(manifest);    //this.cssHtml  &  this.jsHtml

    if(filename==="index.html"||filename==="./index.html")
    {
        store.htmlModules.index=this;   //首页
    }

    if(!filename){ 
        store.scriptBlock.report();       
        return this;
    } 

    if(store.htmlModules[this.filename])return store.htmlModules[this.filename];

    this.filename=xpath.join(config.templatePath,filename);
    this.filepath=xpath.join(config.context,xpath.dirname(filename));  //引用文件参考位置，不能有templatePath
    
    this.inject=inject;

    store.htmlModules[this.filename]=this;

    this.read();
}

HtmlModule.prototype={
    constructor:HtmlModule,
    cssUrlRegExp:/\burl\s*\(\s*(['"]?)(.*?)(?:\1\s*\))/ig,
    read:function(){
        var _this=this,
           filename=this.filename,
           cssUrlRegExp=this.cssUrlRegExp;
        new EasyReader(filename).then(function(html){
                var outputname,rules=config.rules.template;

                 rules.forEach(function(f){
                     html=f(html);
                 });

                new HTMLParser(html, {
                    start: function(tagName,attrs) {
                        var handle,style,m;                        
                        tagName=tagName.toLowerCase();
                        handle=_this.htmlHandle[tagName];
                        handle&&handle(_this.filepath,_this.outputPath,attrs);

                        style=attr(attrs,"style");
                        if(style){
                            while(m=cssUrlRegExp.exec(style)){
                                m[2]&&copyFile(_this.filepath,_this.outputPath,m[2]);
                            }
                        }
                    }
                });


                html=_this.injectHtml(html);
                if(typeof config.htmlMinify==="object")
                {
                   html= minify(html,config.htmlMinify);
                }

                _this.exports=html;  

                store.scriptBlock.report();  

                 if(config._isDevServer){
                    return;
                }

                xfs.outputFile(_this.outputname, html,function(err){
                    if(err)
                    {
                        //console.log(err) // => null
                        utils.showError(err);
                    }       
                });         

            },function(err){
            });
    },
    makeJsCss:function(manifest){
        var css="",
            js="",
            i=0,
            ii=manifest.length,
            outputPath=this.outputPath,
            relateUrl;

        for(;i<ii;i++){
            relateUrl=xpath.getUrlRelative(outputPath,manifest[i].path);
            if(manifest[i].type==="js")
            {
                js+='\n<script src="';
                js+=relateUrl;
                js+='"></script>';       
            }
            else
            {
                css+='\n<link rel="stylesheet" href="';
                css+=relateUrl;
                css+='" />';
            }
        }
        
        this.cssHtml=css;
        this.jsHtml=js;
   },
   injectHtml:function(html,css,js,isHead){
        var start=html.indexOf("</head>");
        if(start===-1)
        {
            utils.showError("Unmatched the <head></head>"); 
            return html;
        }

        if(this.inject==="head")
        {
            return html.substring(0,start)+this.cssHtml+this.jsHtml+html.substr(start);
        }

        html=html.substring(0,start)+this.cssHtml+html.substr(start);
        start=html.lastIndexOf("</body>");

        if(start===-1)
        {
            utils.showError("Unmatched the <body></body>");   
            return html;
        }
        return html.substring(0,start)+this.jsHtml+html.substr(start);
    },
   htmlHandle:{
        "link":function(filepath,outputPath,attrs){
            var filename=attr(attrs,"href");
            if(filename){
               copyFile(filepath,outputPath,filename);
            }
        },
        "img":function(filepath,outputPath,attrs){
            srcCopy(filepath,outputPath,attrs);
            var filename=attr(attrs,"srcset");
            if(filename)
            {
                filename=filename.split(",");
                var i=filename.length;
                while(i--)
                {
                    copyFile(filepath,outputPath,filename[i].split(" ")[0]);
                }
            }
        },
        "script":srcCopy,
        "embed":srcCopy,
        "audio":srcCopy,
        "video":srcCopy,
        "source":srcCopy,
    }  
};

function attr(attrs,k){
    var i=attrs.length;
    while(i--)
    {
        if(attrs[i].name===k)
            return attrs[i].value;
    }
    return null;
}

function copyFile(filepath,outputPath,filename){
    if(filename.startsWith("http://")||filename.startsWith("https://"))
    {
        return filename;
    }

    if(filename.startsWith("/")){
        outputPath=config.outputPath;
    }
    return easyFileCopy(xpath.join(filepath,filename),xpath.join(outputPath,filename));
}

function srcCopy(filepath,outputPath,attrs){
    var filename=attr(attrs,"src");
    if(filename){
        if(filename.startsWith("/")){
            outputPath=config.outputPath;
        }
        
       copyFile(filepath,outputPath,filename);
    }
}

module.exports=HtmlModule;