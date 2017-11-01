# coolpack

coolpack is a module bundler,enables add version number automatically,load asynchronously,and do the relevant optimization.

### Install with npm:

```bash
$ npm install coolpack -g
```

### Usage
In your current path

```bash
$ coolpack
```
start dev Server

```bash
$ coolpack --server --minify=false
```
```bash
$ coolpack -s -m=false
```
---

### The ideal web structure

<pre><code>
    │ 
    ├── news.html
    │    ├── js/common.js
    │    └── js/news.js
    │
    ├── news/detail.html
    │    ├── js/common.js
    │    └── js/detail.js

</code></pre>

coolpack:

<pre><code>
<span style="color:#558B3A">//coolpack.config.js</span>

module.exports={
    module:{
            list:[
                {
                name:"common-module-A.js"
                },
                {
                    name:"common-module-B.js"
                }
            ],
            output:"js/common.js",
            
            module:[
                {
                    list:{name:"src/news.js"},
                    output:"js/news.js",
                    template:"news.html"
                },
                {
                    list:{name:"src/detail.js"},
                    template:"news/detail.html"
                }
            ]
    }
}
</code></pre>

---

### Advantage

<table border="1">
  <thead>
    <tr>
        <th>Description</th>
        <th>Others</th>
        <th>coolpack</th>
    </tr>
  </thead>
  <tbody>
     <tr>
       <td>Public documents</td>
       <td>
          webpack+CommonsChunkPlugin
       </td>
       <td>          
          config=module:{
               module:{}
          }
       </td>
     </tr>
     <tr>
       <td>Asynchronous load module</td>
       <td>
          module.js  3k -> 1 request<br />
          module.css 2k -> 2 request
       </td>
       <td>          
          module.js+module.css  5k -> 1 request
       </td>
     </tr>
     <tr>
       <td>
          css image path<br />
          moduleA &lt;- background:url(img/img.jpg)
       </td>
       <td>
          root/news.html + moduleA  <span style="color:#558B3A">background &radic;</span><br />
          root/news/detail.html + moduleA <span style="color:red">background &times;</span>
       </td>
       <td>          
          root/news.html + moduleA  <span style="color:#558B3A">background &radic;</span><br />
          root/news/detail.html + moduleA <span style="color:#558B3A">background &radic;
       </td>
     </tr>
  </tbody>
</table>

---

### <a href="https://github.com/anderpang/coolpack-demo" target="_target" title="coolpack demo">coolpack demo</a>

### <a href="https://github.com/anderpang/coolpack" target="_target" title="coolpack demo">https://github.com/anderpang/coolpack</a>
---

### coolpack.config.js
<pre><code>
module.exports={
    context:"",                      <span style="color:#558B3A">//Working path, the default is the current path</span>
    outputPath:"./build",            <span style="color:#558B3A">//Package output path, the default is "build"</span>
    templatePath:"./public",         <span style="color:#558B3A">//The path where the template is located</span>
    module:{                         <span style="color:#558B3A">//Module structure configuration</span>
        list:[{                      <span style="color:#558B3A">//The module is included in the module</span>
            name:"lib/jquery.js",    <span style="color:#558B3A">//Module path (The relative path for the resource context)</span>
            alias:"jquery",          <span style="color:#558B3A">//Module alias [optional]</span>
            untreated:true           <span style="color:#558B3A">//Whether to use coolpack analysis processing [optional]</span>
        },
        {
           name:"lib/swiper.js",
           untreated:true
        }],
        output:"common.js",         <span style="color:#558B3A">//The module output name [optional]</span>

        module:{
            list:{name:"entry.js"},
            output:"js/init.js",
            css:"css/style.css",
            template:"index.html",
            inject:"head",//"body"  <span style="color:#558B3A">//js plugin location, this default is "body" [optional]</span>
        }
        
    },

   cssFileLimit:8192,              <span style="color:#558B3A">//convert to base64 in css file , the default is not converted [optional]</span>
   rules:{                         <span style="color:#558B3A">//[Optional]</span>  
        js:[],                     <span style="color:#558B3A">//[function(js){return js;}]</span>          
        css:[],                    <span style="color:#558B3A">//[function(css){return css;}]</span>         
        template:[]                <span style="color:#558B3A">//[function(html){return html;}]</span>         
    },
    babel:{                       
       plugins:[],
       presets:[]
    },

    uglifyJs:{},
    postcssPlugins:[],
    cssSyntax:"",                  <span style="color:#558B3A">//String: "less" or "sass" or "scss"</span>
                                   <span style="color:#558B3A">//Function: function(css,next){</span>
                                   <span style="color:#558B3A">               var out=xxCssParse(css);</span>
                                   <span style="color:#558B3A">               var err=null;</span>
                                   <span style="color:#558B3A">                   next(err,out);</span>
                                   <span style="color:#558B3A">           }</span>
    htmlMinify:{},

   proxy:{                         <span style="color:#558B3A">//Proxy server</span>
       "/api/":{                   <span style="color:#558B3A">//request url:"http://test.com/api/***"</span>
           target:"http://test.com"
       }
   },
    hash:function(){                <span style="color:#558B3A">//hash value [optional]</span>
        var date=new Date();
        var month=date.getMonth()+1;
        var dt=date.getDate();
        var order=Math.floor(Math.random()*90000)+10000;  
        
        return date.getFullYear()+"-"+(month<10?"0"+month:month)+"-"+(dt<10?"0"+dt:dt)+"-"+order;
    },
   
    useStrict:true,               <span style="color:#558B3A">//default true[optional]</span>
    extractFirstCss:true,         <span style="color:#558B3A">//default true[optional]</span>
    watch:false                     <span style="color:#558B3A">//default false[optional]</span>
};

</code></pre>
