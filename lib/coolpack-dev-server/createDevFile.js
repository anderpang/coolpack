
const xpath=require("../coolpack/xpath");
const config=require("../coolpack/config");
const store=require("../coolpack/store");

function createDevFile(){
    if(config._isDevServer&&config.devServer.hot!==false){
        var devServer=config.devServer,
            filename="__coolpack__.js",
            dev_code=`"use strict";
            (function(){
             var __coolpack_ws,
               actions={
                   reload:function(){
                     console.log("reloading...");
                     location.reload(true);
                   },
                   css:function(message,data){
                      console.log("css update...");
                      __coolpack_update(function(cache,modules){
                            var i=data.length,m,id,d,c;
                            while(i--){
                               m=data[i];
                               id=m.id;  
                               d=m.data;                            
                               if(m.isFile){
                                 updateCssLink(d);
                               }
                               else
                               {
                                 c=cache[id];
                                 if(c){
                                   console.log(c.exports);
                                   c.exports.__cssStyle.textContent=cssWrap(d)(c.context);
                                 }
                                 else
                                 {
                                   c=modules[id];
                                   if(c){
                                     c.exports.__css=cssWrap(d);
                                   }
                                 }
                               }
                            }
                      });
                   }
               },
               cssWrap=function(data){
                  return new Function("path","var css=\\"\\";"+data+"return css");
               },
               updateCssLink=function(f){
                  var lks=document.getElementsByTagName('head')[0].getElementsByTagName("link"),
                      i=lks.length,
                      r=Math.random(),
                      href;
                    
                      while(i--){
                         href=lks[i].href||"";
                         if(href.lastIndexOf(f)!==-1){
                             lks[i].href=href.split("?")[0]+"?_r="+r;
                         }
                      }
               };

              function conn(){
                   __coolpack_ws=new WebSocket("ws://${devServer.host}:${devServer.port}");

                  __coolpack_ws.addEventListener("open",function(){console.log("[WDS] Hot Module Replacement enabled.");},false);

                  __coolpack_ws.addEventListener("message",function(e){
                    var j=JSON.parse(e.data),
                        type=j.type;                   

                    actions[type]&&actions[type](j.message,j.data);

                  },false);
                  __coolpack_ws.addEventListener("close",function(e){
                    //console.log(e);
                  },false);
                  __coolpack_ws.addEventListener("error",function(e){
                    console.log(e);
                  },false);
              }
              
              conn();           
         })();
         `;

         store.jsNetRequestMap[filename]=dev_code;

         return  xpath.join(config.outputPath,filename);
    }

    return null;
}

module.exports=createDevFile;

