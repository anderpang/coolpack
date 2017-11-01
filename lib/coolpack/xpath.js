const path=require("path");

const xpath=Object.create(path,{
    getUrlRelative:{
        value:function(from,to){
           return this.relative(from,to).split("\\").join("/");
       }
    }
});

module.exports=xpath;