
const cache=require("./cache");

function getHomePage(){
    var store=cache.store;
    var indexPage=store.htmlModules.index;
    var html;
    if(indexPage){
        html=indexPage.exports;
    }
    else{      
        html=`<!DOCTYPE html>
        <html>
         <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,shrink-to-fit=no" />
          <title> coolpack </title>
         </head>
         <body style="text-align:center">
           <h1>coolpack</h1>
           <div>v${cache.config._version}</div>
         </body>
        </html>`;
    }

    return html;   
}

module.exports=getHomePage;

