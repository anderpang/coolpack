
function ReportSys(){
}

ReportSys.prototype={
    constructor:ReportSys,   
    sign_up:function(){
        if(!this.__report_ready)
        {
            this.__report_ready=true;
            this._counter=0;
            this._total=0;
        }
        return this._total++;
    },
    report:function(){
        if(++this._counter===this._total){
            this.complete&&this.complete();
        }
    }
};

module.exports=ReportSys;