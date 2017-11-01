const NativeModule=require("module");

const xpath=require("./xpath");
const EasyReader=require("./EasyReader");
const store=require("./store");

//filename:绝对路径
function UntreatedModule(filename,blockId,front_modules){
    var ezm=store.jsModules[filename];
    if(ezm){
         store.registers[blockId].sign_up();
         store.registers[blockId].queues.push(ezm);
         store.registers[blockId].report();
        return ezm;
    }
    this.id=filename;   //源生Module的id
    this.moduleIndex= store.moduleIndex++;
    this.blockId=blockId;
    this.filename=filename;
    this.dirname=xpath.dirname(filename);    
    this.paths=NativeModule._nodeModulePaths(this.dirname); //源生路径生成[dirname,node_modules];

    store.registers[blockId].sign_up();
    store.registers[blockId].queues.push(this);
    store.jsModules[filename]=this;
    
    front_modules=Object.create(front_modules);
    front_modules[filename]=this;
    this.front_modules=front_modules;

    this.parse();
}

UntreatedModule.method=function(k,v){
    return this.prototype[k]=v,this;
};

UntreatedModule.method("resolve",function(request){
    return NativeModule._resolveFilename(request, this);
}).method("parse",function(){
    var _this=this,
        filename=this.filename,
        resolve=function(data){
           _this.code=data;
           _this.wrap();
        },
        reject=function(err){
            _this.code="";
            _this.wrap();
        };

        if(filename.startsWith("http://"))
        {
            new EasyReader(filename,true).then(resolve,reject);
        }
        else if(filename.startsWith("https://")){
            new EasyReader(filename,true,true).then(resolve,reject);
        }
        else
        {
            filename=this.resolve(filename);

            if(filename)
            {           
               new EasyReader(filename).then(resolve,reject);
            }
            else
            {
                console.log("\x1b[31m Error: no such file ("+filename+") \x1b[0m");
            }
        }
    
}).
method("wraps",["function(exports,require,module){","\n}"]).
method("wrap",function(){
    var wraps=this.wraps,
        bundle=wraps[0];

        bundle+=this.code;
        bundle+=wraps[1];
        
     this.exports=bundle;

     store.registers[this.blockId].report();
});

module.exports=UntreatedModule;



