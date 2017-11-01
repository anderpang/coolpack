const uglifyJs=require("uglify-js");

const config=require("./config");
const createScriptFile=require("./createScriptFile");

function disposeEnsureModules(queues,manifest){
    var wraps=["require.define([",'',"],","",");"],
        minify=config.minify!==false,
        uglifyJsOptions=config.uglifyJs,
        pack_code,
        fileSize,
        filepath,
        f,
        m;

        for(f in queues){
            m=queues[f];
            wraps[1]=m.deps_moduleIndexes.join(",");
            wraps[3]=m.exports;
            pack_code=wraps.join("");
            if(minify)
            {
                pack_code=uglifyJs.minify(pack_code,uglifyJsOptions).code;
            }

           fileSize=Buffer.byteLength(pack_code);

           filepath=createScriptFile(pack_code,m.moduleIndex+".js",m.moduleIndex);
           manifest.push({
               type:"ensure",
               path:filepath,
               size:fileSize
           });
        }    

}

module.exports=disposeEnsureModules;

