const xfs=require("fs-extra");

const config=require("./config");
const store=require("./store");

//处理完http://  https://后再调用
function easyFileCopy(from,to){
   if(config._isDevServer)return to;

   var isSuccess=true;

   from=from.split("?")[0];
   to=to.split("?")[0];

   if(store.copyFileList[from]){
      return store.copyFileList[from];
   }
  
    try {
      xfs.copySync(from,to);
    } catch (err) {
      isSuccess=false;
      console.error(err);      
    }

    if(isSuccess){
        store.copyFileList[from]=to;
    }

    return to;
}

module.exports=easyFileCopy;