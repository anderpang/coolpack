const fs=require("fs");
const http=require("http");
const https=require("https");
const utils=require("./utils");

function EasyReader(filename,isHttp,isHttps){
    return new Promise(isHttps?
        function(resolve,reject){        
            https.get(filename,function(res){
               f(res,resolve,reject);
            });
        }:
        isHttp?
        function(resolve,reject){        
            http.get(filename,function(res){
               f(res,resolve,reject);
            });
        }:function(resolve,reject){
          var rs = fs.createReadStream(filename);
           f(rs,resolve,reject);
        });
}

function f(stm,resolve,reject){
    var i=0,
      data=[];
    stm.on('data', function (chunk) {
        data[i++]=chunk;
    }).on('end', function () {
        resolve(Buffer.concat(data).toString("utf8"));
    }).on('error',function(err){
        utils.showError(err);
        reject(err);
    });
}

module.exports=EasyReader;
