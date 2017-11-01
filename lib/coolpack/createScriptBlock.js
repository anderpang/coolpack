const uglifyJs=require("uglify-js");

const xpath=require("./xpath");
const config=require("./config");
const utils=require("./utils");
const ReportSys=require("./ReportSys");
const EasyModule=require("./EasyModule");
const UntreatedModule=require("./UntreatedModule");
const createFirstCss=require("./createFirstCss");
const createScriptFile=require("./createScriptFile");
const HtmlModule=require("./HtmlModule");
const store=require("./store");
const disposeEnsureModules=require("./disposeEnsureModules");
const listQueues=require("./listQueues");
const createDevFile=require("../coolpack-dev-server/createDevFile");


function createScriptBlock(config_module,front_modules,front_manifest,blockId){

     if(typeof config_module!=="object")
     {
        utils.showError("config.module must be a Object!");
        return;
     }

     if(Array.isArray(config_module)){
         config_module.forEach(function(m,i){
             createScriptBlock(m,front_modules,front_manifest,blockId+i);
         });
         return;
     }

     store.scriptBlock.sign_up();

       var moduleSys=new ReportSys();
        moduleSys.module=config_module;
        moduleSys.blockId=blockId;
        moduleSys.complete=block_complete;
        moduleSys.queues=[];      //[module]
        moduleSys.ensure_filenames=[];   //["filename"];
        moduleSys.front_modules=front_modules;
        moduleSys.manifest=front_manifest.slice();
        moduleSys.isInit=!config_module.hasOwnProperty("module"); //是否初始化

        store.registers[blockId]=moduleSys;
        moduleSys.list_index=0;

    if(Array.isArray(config_module.list))
    {        
        moduleSys.list_len=config_module.list.length;        
        createPart(config_module.list[0],front_modules,front_manifest,blockId);        
    }
    else
    {
        moduleSys.list_len=1;
        createPart(config_module.list,front_modules,front_manifest,blockId);
    }
}

function createPart(part_module,front_modules,front_manifest,blockId)
{
    var name=part_module.name,
        alias=part_module.alias,
        moduleIndex=store.moduleIndex;
            
        if(alias){
            if(isNaN(alias))
            {  
                //别名索引
                store.alias[alias]=moduleIndex;
            }
            else
            {
                utils.showError(alias+" - Alias can not be a number!");
            }
        }

        if(part_module.untreated)
        {
            if(!name.startsWith("http://")&&!name.startsWith("https://")){
                name=xpath.resolve(config.context,name);
            }
            new UntreatedModule(name,blockId,front_modules);
        }
        else
        {
            new EasyModule(xpath.resolve(config.context,name),blockId,null,front_modules);
        }
}

function block_complete(){ 
   //下一个
   if(++this.list_index<this.list_len)
   {
       createPart(this.module.list[this.list_index],this.front_modules,this.front_manifest,this.blockId);
       return;
   }

    var pack_code=config.useStrict===false?"":'"use strict";\n',
        modules=[],
        ensure_modules=[],
        queues=this.queues,
        ensure_filenames=this.ensure_filenames,
        isInit=this.isInit,
        blockId=this.blockId,
        isFirstBlock=blockId===0,
        filepath,
        fileSize,
        manifest=this.manifest,
        i=0,
        ii=queues.length,
        initModuleIndex=false;
             
       if(isFirstBlock)
       {
           pack_code+=require("./base-code"); 
           pack_code+='(this,{';
       }
       else
       {
           pack_code+='require.push({';
       }       
        
        //加插件位置（待完善)

        //第一个css文件
        if(isInit)
        {
            fileSize=Buffer.byteLength(queues[0].__css);
            filepath=createFirstCss(queues[0],this.module.css,blockId);
            if(filepath){
                manifest.push({
                    type:"css",
                    path:filepath,
                    size:fileSize
                });
            }
        }

        for(;i<ii;i++){
            ensure_filenames.indexOf(queues[i].filename)!==-1?ensure_modules.push(queues[i]):modules.push(queues[i]);
        }

        pack_code+=modules.map(function(m){
            return m.moduleIndex+":"+m.exports;
        }).join(",\n");

        pack_code+='},';

        if(isInit&&modules.length){
            initModuleIndex=modules[0].moduleIndex;
        }

        pack_code+=initModuleIndex.toString();
        pack_code+=');';

    
        if(config.minify!==false)
        {
            pack_code=uglifyJs.minify(pack_code,config.uglifyJs).code;
        }

       fileSize=Buffer.byteLength(pack_code);
       filepath=createScriptFile(pack_code,this.module.output,blockId);
       manifest.push({
           type:"js",
           path:filepath,
           size:fileSize
       });
       

       if(isInit)
       {

          //调试模式下输出
          filepath=createDevFile();
          
          if(filepath){
              manifest.unshift({
                  type:"js",
                  path:filepath,
                  isDev:true
              });
          }

          store.scriptBlock.sign_up();
          new HtmlModule(this.module.template,this.module.inject,manifest);

          //处理ensure
          disposeEnsureModules(ensure_modules,manifest);

          listQueues(manifest);
          
       }
       else
      {
           //有子模块
           createScriptBlock(this.module.module,this.front_modules,manifest,++blockId);
      }

       store.scriptBlock.report();
}

module.exports=createScriptBlock;

