const NativeModule=require("module");
const acorn = require("acorn");
const estraverse=require("estraverse");
const babel=require("babel-core");

const config=require("./config");
const ReportSys=require("./ReportSys");
const easyFileCopy=require("./easy-file-copy");
const store=require("./store");
const xpath=require("./xpath");
const utils=require("./utils");
const CssModule=require("./CssModule");

//模块绝对路径，文件块id,父module，前面的模块
function EasyModule(filename,blockId,parent,front_modules,isEnsure){
    var ezm=store.jsModules[filename];
    if(ezm){
        // if(store._isHotUpdate){
        //    ezm._disabledCss=false;
        // }
         store.registers[blockId].sign_up();
         store.registers[blockId].queues=store.registers[blockId].queues.concat(ezm,ezm.deps);
         isEnsure&&store.registers[blockId].ensure_filenames.push(filename);
         store.registers[blockId].report();
        return ezm;
    }
    this.type="js";
    this.id=filename;   //源生Module的id
    this.moduleIndex=store.moduleIndex++;
    this.blockId=blockId;
    this.filename=filename;
    this.dirname=xpath.dirname(filename);    
    this.paths=NativeModule._nodeModulePaths(this.dirname); //源生路径生成[dirname,node_modules];
    this.parent=parent;
    this._cssModules=[];
    this.__css="";
    this.es5_code="";
    this.code="";
    this.exports=null;
    this.require_alias={};

    this.deps=[];
    this.replace_deps=[];
    this.replace_node=[];

    this._InEnsure=[]; //0为未进入ensure
    

    this._isUpdate=false;

    store.registers[blockId].sign_up();
    store.registers[blockId].queues.push(this);
    isEnsure&&store.registers[blockId].ensure_filenames.push(filename);
    store.jsModules[filename]=this;
    
    front_modules=Object.create(front_modules);
    front_modules[filename]=this;
    this.front_modules=front_modules;
 
    this.parse();
}

EasyModule.method=function(k,v){
    return this.prototype[k]=v,this;
};

EasyModule.prototype=new ReportSys();

EasyModule.method("resolve",function(request){
    return NativeModule._resolveFilename(request, this);
}).method("parse",function(){
    var _this=this,
        babelConfig=config.babel,
        rules=config.rules.js,
        result=babel.transformFileSync(this.filename,babelConfig);
     
    this.sign_up();

    var code=result.code.replace('"use strict";','');  //去除开始的严格模式，最后统一加上。

     rules.forEach(function(f){
         code=f(code);
     });

    this.es5_code=code;
   // console.log(this.es5_code[filename]);

   let ast=acorn.parse(code,{
       // ranges: true,
        //locations: true,
        ecmaVersion: 2017,
        sourceType: "module"
    });   

    estraverse.traverse(ast, {
            enter: function (node,parent) {
                 
                 switch(node.type){
                     case "Program":
                     case "FunctionDeclaration":
                         _this.currentScope=node;
                     break;
                     case "CallExpression":
                          //require.ensure
                          if(node.callee.type==="MemberExpression"&&node.callee.object.name==="require"&&node.callee.property.name==="ensure")
                          {
                              if(node.arguments[0].type==="ArrayExpression"){
                                  var deps=node.arguments[0].elements,
                                      i=0,
                                      ii=deps.length,                                      
                                      isBreak=false;

                                  for(;i<ii;i++){
                                     if(!_this.appendDeps(deps[i].value,deps[i],true))
                                     {
                                         isBreak=true;
                                         break;
                                     }
                                  }

                                  isBreak&&this["break"]();
                                   
                                   var func=node.arguments[1];
                                  if(func.type==="FunctionExpression"&&func.params.length)
                                  {
                                      if(func.params[0].name!=="require")
                                      {
                                         _this.require_alias[func.params[0].name]=func;
                                      }

                                      _this._InEnsure.push(func);
                                  }
                              }
                              else{
                                  utils.showError("WARNING in "+_this.filename);
                                  utils.showError(code.substring(node.start,node.end));
                                  utils.showError("require.ensure([\""+code.substring(node.arguments[0].elements[0].start,node.arguments[0].elements[0].end)+"\"],...)");
                                  this["break"]();
                              }
                          }
                          else if(node.callee.name==="require" || _this.require_alias&&_this.require_alias.hasOwnProperty(node.callee.name)){

                                 if(node.arguments[0])
                                {
                                     if(node.arguments[0].type==="Literal")
                                     {
                                         var request=node.arguments[0].value,
                                             ext;
                                                           
                                         if(!_this.appendAlias(request,node.arguments[0])&&!_this.appendDeps(request,node.arguments[0],false))
                                         { 
                                             ext=xpath.extname(request);
               
                                             if(config.cssExtname.indexOf(ext)!==-1)
                                             {
                                                 _this.replace_node.push(node);
                                                 _this.replace_deps.push({type:"css"}); 
                                                 _this.appendCss(request);
                                             }
                                             else
                                             {
                                                 _this.replace_node.push(node);
                                                 _this.replace_deps.push(null); 
                                             }
                                         }
                                     }
                                     else
                                    {
                                         var start=node.arguments[0].start,
                                             end=node.arguments[0].end;
                                           start=code.lastIndexOf("\n",start);                                           
                                           end=code.indexOf("\n",end);
                                           if(start===-1)start=0;
                                           if(end===-1)end=code.length;
                                        utils.showError(_this.filename);
                                        utils.showError(code.substring(start,end));
                                        utils.showError("Critical dependency: the request of a dependency is an expression!");
                                        this["break"]();
                                     }
                                }
                              }
                
                     break;

                     case "VariableDeclaration":
                         var declarations=node.declarations;
                         if(_this.checkRightIsRequire(declarations[0])){
                             _this.require_alias[declarations[0].id.name]=_this.currentScope;
                         }
                      break;
                 }
               
            },
            leave:function(node,parent){
               var alias=_this.require_alias,k,
                  InEnsure=_this._InEnsure;

               if(node===_this.currentScope){
                   _this.currentScope=null;
               }
               
                for (k in alias)
                {
                    if(alias[k]===node){
                        delete alias[k];
                    }
                }

                k=InEnsure.length;
                while(k--){
                    if(InEnsure[k]===node){
                        InEnsure.splice(k,1);
                        break;
                    }
                }               
                
            }
        });
  
       this.report();
    
}).method("checkRightIsRequire",function(declarations){
    var init=declarations.init;
    if(!init)return false;
    if(init.type==="Identifier"){
        return init.name="require";
    }
    else if(init.type==="AssingmentExpression")
    {
        return this.checkRightIsRequire(init.right);
    }
    return false;
}).method("appendCss",function(filename){
    var _this=this,
        cssModule;

        filename=xpath.join(this.dirname,filename);

        if(this._isUpdate)
        {
            cssModule=new CssModule(filename,null,this.filename,null);
        }
        else
       {
           cssModule=new CssModule(filename,null,this.filename,function(css){
                _this.report();
            });
            this.sign_up();
       }
       this._cssModules.push(cssModule);

}).method("combineCss",function(){
    var cssModules=this._cssModules,
        css="",
        i=0,
        ii=cssModules.length;    

        for(;i<ii;i++){
            css+=cssModules[i].getUnstablePathCss();         
        }
        this.__css=css;    
}).method("getFileCss",function(cssFileName){
     var cssModules=this._cssModules,
         cssFilePath=xpath.dirname(cssFileName),
        css="",
        i=0,
        ii=cssModules.length;    

        for(;i<ii;i++){
            css+=cssModules[i].getRelativePathCss(cssFilePath);         
        }

        this._cssFileName=cssFileName;
        this.wrap();

        return css;
}).method("appendAlias",function(request,node){
     if(store.alias.hasOwnProperty(request))
    {
        this.replace_node.push(node);
        this.replace_deps.push({
            moduleIndex:store.alias[request]
        });
        return true;
    }

    return false;

}).method("appendDeps",function(filename,node,isEnsure){
     var depModule,ensureIndex;

     filename=this.resolve(filename);
 
     if(!filename){
         utils.showError("Error: no such file ("+filename+")");  
         return false;
     }

     depModule=this.front_modules[filename];  //don't hasOwn

    //如果前面的模块中有  
     if(depModule)
     {
         this.replace_node.push(node);        
         this.replace_deps.push(depModule);
         this.deps.push(depModule);
          
         isEnsure&&store.registers[this.blockId].ensure_filenames.push(filename);
     }
     else if(config.moduleExtname.indexOf(xpath.extname(filename))!==-1)
     {
         this.replace_node.push(node);
         depModule=new EasyModule(filename,this.blockId,this,this.front_modules,isEnsure);
         this.replace_deps.push(depModule);
         this.deps.push(depModule);
     }
     else
     {
         return false;
     }

     return true;
}).method("update",function(callback){
    this._isUpdate=true;
    this.updateCallback=callback;
    this.replace_deps.length=this.deps.length=0;    

    this.parse();
}).method("complete",function(){
    var code=this.es5_code,
        deps=this.replace_deps,
        nodes=this.replace_node,
        deps_moduleIndexes=[],
        ensureModules=this.ensureModules,
        deps_moduleIndex,
        i=nodes.length,
        outputPath=config.outputPath,
        publicPath=config.publicPath,
        hash=config.hash,
        copyName,
        m,
        n;

      this.deps_moduleIndexes=deps_moduleIndexes;      
     
      while(i--){
          m=deps[i];
          n=nodes[i];
          if(m)
          {
              if(m.type==="css")
              {
                  code=code.substring(0,n.start)+code.substr(code[n.end+1]===";"?n.end+1:n.end);
              }
              else
              {
                 deps_moduleIndex=m.moduleIndex;
                 deps_moduleIndexes.push(deps_moduleIndex);
                 code=code.substring(0,n.start)+deps_moduleIndex+code.substr(n.end); 
              }
          }
          else
          {
             m=n.arguments[0].value;        
             copyName=easyFileCopy(xpath.join(this.dirname,m),xpath.join(outputPath,hash,m));
             code=code.substring(0,n.start)+"\""+xpath.getUrlRelative(config.outputPath,copyName)+"\""+code.substr(n.end);             
          }
      }

      this.code=code;

      nodes.length=0;

      this.combineCss();

      this.wrap();
}).method("cssWrap",function(){
    var css="function(path){var css=\"\";";
        css+=this.__css;
        css+="return css};";

        return css;
}).method("wraps",["function(exports,require,module){",";exports.__css=","\n}"]).
method("wrap",function(){
    var wraps=this.wraps,
        bundle=wraps[0];
        
        bundle+=this.code;
        if(!this._cssFileName&&this.__css){
            bundle+=wraps[1];           
            bundle+=this.cssWrap();
        }
        bundle+=wraps[2];

     this.exports=bundle;

     if(this._isUpdate)
    {
         this._isUpdate=false;
         this.updateCallback&&this.updateCallback();
    }
    else
    {
        
         store.registers[this.blockId].report();
    }
});

module.exports=EasyModule;



