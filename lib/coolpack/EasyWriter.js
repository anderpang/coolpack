const fs=require("fs");

  function EasyWriter(){
      this._events={};
      this._data=[];
  }

  EasyWriter.prototype.on=function(type,fn){
      var listeners=this._events[type]||(this._events[type]=[]);
      listeners.push(fn);
      return this;
  };

  EasyWriter.prototype.emit=function(type){
      var listeners=this._events[type],i;
      if(listeners)
      {
          i=listeners.length;
          while(i--){
              listeners[i].call(this);
          }
          listeners.length=0;
      }
      return this;
  };

  EasyWriter.prototype.inputFile=function(filename){
      var _this=this;
      fs.createReadStream(filename).on("close",function(){
          _this.emit("finish");
      }).on("data",function(buffer){
          _this._data.push(buffer);
      });
      return this;
  };

  EasyWriter.prototype.concat=function(ew){
      this._data=this._data.concat(ew._data);
      return this;
  };

  EasyWriter.prototype.toString=function(charset){
      return Buffer.concat(this._data).toString(charset||"utf8");
  };

  module.exports=EasyWriter;
