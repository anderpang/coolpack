const xpath=require("./xpath");
const config=require("./config");

//第一个输出的js文件
var baseJsName,
    cssStyle,
    updateFun,
    isHotUpdate=config._isDevServer&&config.devServer.hot!==false;

if(config.module.output){
    baseJsName=xpath.join(config.hash,config.module.output);
}
else
{
    baseJsName=xpath.join(config.hash,"chunk-0.js");
}

baseJsName=baseJsName.split("\\").join("/");
cssStyle=isHotUpdate?";this.exports.__cssStyle=o":"";
updateFun=isHotUpdate?"m.__coolpack_update=function(n){n(b,d)};":"";

const base_code=`(function(m,d,i){var b={},a="${baseJsName}",e="",h={};function c(o){var n=b[o];if(!n){n=b[o]=new f();n.code=d[o];n.exec()}return n.exports.__esModule?n.exports["default"]:n.exports}c.define=function(o,n){h.deps=o;h.code=n};c.ensure=function(r,s){var n=0,o=r.length,p=0,q=function(){if(++p===o){s(c)}};if(o){for(;n<o;n++){g(r[n],q)}}else{s(c)}};c.push=function(o,n){j(d,o);if(!i&&n!==false){i=n;return c(n)}};function f(){this.ready=false;this.exports={};this.listeners=[]}f.prototype={exec:function(){this.ready=true;this.code(this.exports,c,this);this.code=null;if(this.exports.__css){this.setCss(this.exports.__css(this.context));delete this.exports.__css}this.dispatch()},subscribe:function(n){this.listeners.push(n)},dispatch:function(){var o=this.listeners,n=o.length;while(n--){o[n](c)}this.listeners=null},setCss:function(n){var p=document,o=document.createElement("style");o.textContent=n;p.head.appendChild(o)${cssStyle}},context:location.origin||(location.protocol+"//"+location.host),hash:"${config.hash}"};function g(p,r){var o=b[p],n,q;if(o){o.ready?r(c):o.subscribe(r)}else{o=new f();o.subscribe(r);b[p]=o;q=document;n=q.createElement("script");n.async=true;n.onload=function(){var u=h.deps,s=u&&u.length,t=h.code;o.code=t;s?c.ensure(u,function(){o.exec()}):o.exec()};n.src=l(p);q.head.appendChild(n)}}function j(p,o){for(var n in o){p[n]=o[n]}return p}function k(){var o=document.currentScript,r,n,p,q;if(o){r=o.src}else{n=document.scripts;p=0;q=n.length;for(;p<q;p++){r=n[p].src;if(r.indexOf(a)!=-1){break}}}if(r){e=r.slice(0,r.lastIndexOf("/")+1)}}function l(n){return e+n+".js"}k();${updateFun}m.require=c;if(i!==false){return c(i)}})`;

module.exports=base_code;
