const crypto=require("crypto");

const cache=require("./cache");

function EasySocket(socket,req)
{
  var conn=this;
  this.socket=socket;
  this.readyState=this.CONNECTING;
  this.user_agent=req.headers["user-agent"];
  cache.sockets.push(this);
  
  socket.on("readable",function(){
    var buffer=this.read();
    if(buffer)
    {
      switch(conn.readyState)
      {
        case conn.CONNECTING:  
          conn.handshake(buffer.toString().split("\r\n"));
        break;
        case conn.OPEN:          
          conn.decode(buffer);
        break;
        default:
          conn.close();
      } 
    }
  }).on("close",function(){        
     this.destroy();
  }).on("error",function(err){
    console.log(err);
  }).setTimeout(0);

  this.handshake(req.headers);
}

EasySocket.prototype={
   CONNECTING:0,
   OPEN:1,
   CLOSING:2,
   CLOSED:3,
   handshake:function(headers){
     if(this.readyState==this.CONNECTING)
     {
       this.socket.write(this.handshake2(headers));//新协议
       this.readyState=this.OPEN;      
     }
     else
     {
       this.close();
     }
   },
   handshake2:function(headers){
      var i=headers.length,
      protocol='HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ',
      key="Sec-WebSocket-Key".toLowerCase();
    
      if(headers[key])
      {
        protocol+=crypto.createHash("sha1").update(headers[key]+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
      }
      
      return protocol+"\r\n\r\n";
   },
   decode:function(buffer){
     if(buffer.length<2)
     {      
       return;
     }
     var index=0,opcode,hasMask,payload_len,mask,payload;
     if(!buffer[index]>>7)
     {
       return;
     }
     opcode=buffer[index++]&0xF;

     if(opcode==8||opcode==9||opcode==10)
     {        
        if(opcode==8)
        {
          this.close();
        }     
        return;
     }

     hasMask=buffer[index]>>7;
     payload_len=buffer[index++]&0x7F;

     switch(payload_len)
     {
       case 126:
         payload_len=buffer.readUInt16BE(index);
         index+=2;
       break;
       case 127:
         payload_len=buffer.readUInt32BE(index)*Math.pow(2,32)+buffer.readUInt32BE(index+4);
         index+=8;
       break;
     }

     if(hasMask)
     {
       mask=buffer.slice(index,index+4);
       index+=4;
       for(var i=0;i<payload_len;i++)
       {
         buffer[index+i]^=mask[i%4];
       }       
     }

     payload=buffer.slice(index,index+payload_len); 

     this.encode(1,opcode,0,payload);     
     
   },
   encode:function(fin,opcode,hasMask,buffer){
     
    //  if(opcode===1||opcode===2)
    //  {
    //    buffer=this.format(type,buffer);  //格式化数据
    //  }
     var index=0,len=buffer.length,meta=new Buffer(2+(len<126?0:(len<0x10000?2:8))+(hasMask?4:0));
     meta[index++]=fin*0x80+opcode;
     meta[index]=hasMask*0x80;
     if(len<126)
     {
       meta[index]+=len;
     }
     else if(len<0x10000)
     {
       meta[index]+=126;
       meta.writeUInt16BE(len,2);
       index+=2;
     }
     else
     {
       meta[index]+=127;
       meta.writeUInt32BE(Math.floor(len/Math.pow(2,32)),2);
		   meta.writeUInt32BE(len%Math.pow(2,32),6);
       index+=8;
     }

     if(hasMask)
     {
       var i=0,mask=new Buffer(4);
       for(;i<4;i++)
       {
          meta[index+i]=mask[i]=Math.floor(Math.random()*256);
       }
       for(i=0;i<len;i++)
       {
         payload[i]^=mask[i%4];
       }
     }
     
     this.socket.write(Buffer.concat([meta,buffer]));
     
   },
   push:function(buffer){
      this.encode(1,1,0,buffer);
   },
   close:function(){
     var sockets=cache.sockets;
     this.readyState=this.CLOSED;
     sockets.splice(sockets.indexOf(this),1);    
     this.encode(1,1,0,new Buffer(""),8);    
     this.socket.emit("close");     
   }
};

module.exports=EasySocket;