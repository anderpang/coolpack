(function(ctx,modules,isInit){
    var cache={},
        thisfile="${baseJsName}",
        include_path="",
        currentModule={};
    
    function require(moduleId){
        var module=cache[moduleId];
        if(!module){         
            module=cache[moduleId]=new Module();
            module.code=modules[moduleId];
            module.exec();
        }
        return module.exports.__esModule?module.exports["default"]:module.exports;
    }

    require.define=function(deps,f){
         currentModule.deps=deps;
         currentModule.code=f;
    };

    require.ensure=function(deps,callback){
        var i=0,
            ii=deps.length,
            couter=0,
            allReady=function(){
               if(++couter===ii){
                  callback(require);
               }
            };
         if(ii){
             for(;i<ii;i++){                
                loadModule(deps[i],allReady);
             }
         }
         else
        {
             callback(require);
        }
    };

    require.push=function(add_modules,doInit){
        extend(modules,add_modules);
        //Object.assign(modules,add_modules);
        if(!isInit&&doInit!==false)
        {
           isInit=doInit;
           return require(doInit);
        }
    };

    function Module(){
        this.ready=false;
        this.exports={};
        this.listeners=[];  //订阅者 module 
    }

    Module.prototype={
        exec:function(){
            this.ready=true;
            this.code(this.exports,require,this);
            this.code=null;            
            if(this.exports.__css){
                this.setCss(this.exports.__css(this.context));
                delete this.exports.__css;
            }
            this.dispatch();
        },
        subscribe:function(module){
            this.listeners.push(module);
        },
        dispatch:function(){
            var listeners=this.listeners,
                i=listeners.length;
            while(i--){
                listeners[i](require);
            }
            this.listeners=null;
        },
        setCss:function(css){
            var doc=document,
                style=document.createElement("style");
                style.textContent=css;
                doc.head.appendChild(style);
                this.exports.__cssStyle=style;   //多了这个
        },
        context:location.origin||(location.protocol+"//"+location.host),
        hash:"${config.hash}"
    };

    function loadModule(moduleId,callback){
        var module=cache[moduleId],
            script,
            doc;

        if(module){
            module.ready?callback(require):module.subscribe(callback);
        }
        else
        {
            module=new Module();
            module.subscribe(callback);

            cache[moduleId]=module;
            
            doc=document;
            script=doc.createElement("script");
            script.async=true;
            script.onload=function(){
                var deps=currentModule.deps,
                    hasDeps=deps&&deps.length,
                    code=currentModule.code;

                module.code=code;
                
                hasDeps? require.ensure(deps,function(){module.exec();}): module.exec();              
            };

            script.src=getFilePath(moduleId);
            doc.head.appendChild(script);            
        }
    }

    function extend(target,source){
        for(var k in source) {
            target[k]=source[k];
        }
        return target;
    }

    function setIncludePath(){
        var currentScript=document.currentScript,
            src,
            scripts,
            i,
            ii;
        if(currentScript){
            src=currentScript.src;
        }
        else
        {
            scripts=document.scripts;
            i=0;
            ii=scripts.length;
            for(;i<ii;i++)
            {
                src=scripts[i].src;
                if(src.indexOf(thisfile)!=-1){
                    break;
                }
            }
        }
        if(src)
        {
            include_path=src.slice(0,src.lastIndexOf("/")+1);
        }
    }

    function getFilePath(moduleId){
        return include_path+moduleId+".js";
    }

    setIncludePath();

    /* dev begin */
    ctx.__easypack_update=function(f){
        f(cache,modules);
    };
    /* dev end */


    ctx.require=require;

    if(isInit!==false)
    {
      return require(isInit);
    }
})