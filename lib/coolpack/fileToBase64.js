const fs=require("fs");
const mime = require("mime");
const utils=require("./utils");
const xpath=require("./xpath");
const store=require("./store");

function fileToBase64(filename){

      if(store.base64FileList[filename]){
            return store.base64FileList[filename];
      }

      var content=fs.readFileSync(filename),
              mimetype=mime.getType(xpath.extname(filename)),
              data="data:";
              data+=(mimetype?mimetype+";":"");
              data+="base64,";
              data+=new Buffer(content).toString("base64");

      store.base64FileList[filename]=data;
      return data;
}

module.exports=fileToBase64;
