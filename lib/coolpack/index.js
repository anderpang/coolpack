const babel_plugin_class_prop=require("babel-plugin-transform-class-properties");
const babel_plugin_arrow_fun=require("babel-plugin-transform-es2015-arrow-functions");
const babel_preset_es2015=require("babel-preset-es2015");
const autoprefixer=require("autoprefixer");

const xpath=require("./xpath");
const utils=require("./utils");
const createHash=require("./createHash");
const config=require("./config");
const watching=require("./watching");
const createScriptBlock=require("./createScriptBlock");

function coolpack(customConfig){
    /* 配置处理 begin */
    if(typeof customConfig==="object"){
        utils.extend(config,customConfig);
    }

    if(!config.context){
        config.context=process.cwd();
    }
    else if(!xpath.isAbsolute(config.context))
    {
       config.context=xpath.resolve(process.cwd(),config.context);
    }

    if(!config.outputPath){
        config.outputPath=xpath.join(config.context,"build");
    }
    else if(!xpath.isAbsolute(config.outputPath))
    {
        config.outputPath=xpath.resolve(config.context,config.outputPath);
    }

    if(!config.templatePath){
        config.templatePath=config.context;
    }
    else if(!xpath.isAbsolute(config.templatePath))
    {
        config.templatePath=xpath.resolve(config.context,config.templatePath);
    }
    
    if(config.hasOwnProperty("hash")&&config.hash)
    {
        if(typeof config.hash==="function"){
            config.hash=config.hash();
        }
    }
    else
    {
        config.hash=createHash();
    }

    /* rules begin */
    if(!config.hasOwnProperty("rules")){
        config.rules={};
    }
    if(!Array.isArray(config.rules.js)){
        config.rules.js=[];
    }
    if(!Array.isArray(config.rules.css)){
        config.rules.css=[];
    }
    if(!Array.isArray(config.rules.template)){
        config.rules.template=[];
    }
    /* rules end */

    /* babel begin */
    var babelConfig=config.babel;

    if(!babelConfig){
        babelConfig=config.babel={};
    }

    if(!Array.isArray(babelConfig.plugins)){
        babelConfig.plugins=[];
    }

    if(!Array.isArray(babelConfig.presets)){
        babelConfig.presets=[];
    }


    if(babelConfig.plugins.indexOf(babel_plugin_class_prop)===-1){
        babelConfig.plugins.push(babel_plugin_class_prop);
    }

    if(babelConfig.plugins.indexOf(babel_plugin_arrow_fun)===-1){
        babelConfig.plugins.push(babel_plugin_arrow_fun);
    }

    if(babelConfig.presets.indexOf(babel_preset_es2015)===-1){
        babelConfig.presets.push(babel_preset_es2015);
    }

    if(babelConfig.hasOwnProperty("ast")){
        babelConfig.ast=false;
    }
    if(babelConfig.hasOwnProperty("moduleIds")){
        babelConfig.moduleIds=true;
    }

    /* babel end */

    if(!config.hasOwnProperty("uglifyJs")){
        config.uglifyJs={};
    }

    if(!Array.isArray(config.postcssPlugins)){
        config.postcssPlugins=[];
    }    

    if(!config.moduleExtname){
        config.moduleExtname=[".js"];
    }

    if(!config.cssExtname){
        config.cssExtname=[".css"];
    }

    config.minify=config.minify!==false;    

    if(!config.uglifyJs){
        config.uglifyJs={};
    }

    if(!config.hasOwnProperty("proxy")){
        config.proxy={};
    }

    if(config.hasOwnProperty("cssFileLimit")&&!isNaN(config.cssFileLimit))
    {
        config.cssFileLimit=parseFloat(config.cssFileLimit);
    }
    else
    {
        config.cssFileLimit=0;
    }

    /* css syntax begin */
   switch(config.cssSyntax)
   {
       case "scss":
       case "sass":
         config.cssSyntax=function(css,next){
             require('sass').render({data:css},next);
         };
       break;
       case "less":
         config.cssSyntax=function(css,next){
             require('less').render(css,next);
         };
       break;
   } 

   if(config.postcssPlugins.indexOf(autoprefixer)===-1){
         config.postcssPlugins.push(autoprefixer);
    }
    /* css syntax end */

  
    /* dev Server */
    var devServer=config.devServer;
    if(!devServer){
        devServer=config.devServer={};
    }

    devServer.hot=devServer.hot!==false;

    if(!devServer.hasOwnProperty("host")){
        devServer.host="localhost";
    }

    if(!devServer.hasOwnProperty("port")||isNaN(devServer.port)){
        devServer.port="8181";
    }

    //
    if(devServer.hot){
        config.watch=true;
    }

    /* 配置处理 end */  
    
    watching();
    createScriptBlock(config.module,{},[],0);
}

module.exports=coolpack;

