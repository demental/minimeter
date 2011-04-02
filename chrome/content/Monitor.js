function Monitor(){

	this.listeners = new JArray();
  this.state = this.STATE_DONE;	
  this.errorMessage = "";
	this.extraMessage = null;
	this.remaining = null;
	this.amountToPay = null;
	this.useCache = true;
	this.newData = false; // is the new data different from the old one ? (for the animation)

}

Monitor.prototype.STATE_BUSY = 2;
Monitor.prototype.STATE_ERROR = 1;
Monitor.prototype.STATE_DONE = 0;
Monitor.prototype.STATE_ABORT = 3;

Monitor.prototype.check = function() { // override default action
  this.state = this.STATE_BUSY;
  this.notify();
  this.newData = true;
  this.callback(1);
}


Monitor.prototype.abort = function(){
    this.state = this.STATE_ABORT;
}

Monitor.prototype.getCapacity = function(){
	capacity = prefs.getIntPref('capacity');
	return capacity;
}

Monitor.prototype.notLoggedin = function(){
	this.errorMessage = getString("error.login");
	this.update(false);
}

Monitor.prototype.badLoginOrPass = function(){
	this.errorMessage = getString("error.badLoginOrPass");
	this.update(false);
}

Monitor.prototype.unknownError = function(step,monitor){
	this.errorMessage = getString("error.unknownError");
	var dumpMessage = getString("error.unknownErrorDump").replace ("%step", step);
	dumpMessage = dumpMessage.replace ("%monitor", monitor);
	consoleDump(dumpMessage);
	this.update(false);
}

/*
 * Is called at the end of the transaction
 */ 
Monitor.prototype.update = function(success) {
	
  if(this.state == this.STATE_ABORT){
    return;
  }
          
  if(success){
    this.state = this.STATE_DONE;
    if(this.useCache) this.storeCache();
  } else {
    this.state = this.STATE_ERROR;
    if(this.useCache) this.clearCache();
  }
  
  this.notify();

}

Monitor.prototype.aborted = function(){
  return (this.state == this.STATE_ABORT);
}

 


Monitor.prototype.addListener = function(listener){
  if(!this.listeners.contains(listener)){
      this.listeners.push(listener);
  }
}

Monitor.prototype.removeListener = function(listener){
  this.listeners.remove(listener);
}
Monitor.prototype.removeAllListeners = function(listener){
  this.listeners = new JArray();
}

Monitor.prototype.notify = function(){
  for(i=0;i<this.listeners.length;i++){
      this.listeners[i].update(this);
  }
}

Monitor.prototype.checkCache = function(calledByTimeout){
  provider = prefs.getCharPref('provider');
  cache = prefs.getCharPref('cache');
  updateTimeout = prefs.getIntPref('updateTimeout');
  updateTimeout = updateTimeout * 1000 * 3600;
  var now = new Date().getTime();
  
  cache = cache.split(";");

  if(cache.length >= 5){ // empty cache ?
    // check time
    
    if (cache[0] == provider) {
      var now = new Date().getTime();
      now -= (updateTimeout);
      if(cache[1] > (now + 4000)) {
        cache[6] = false;
        prefs.setCharPref('cache', cache.join(";"));
        this.loadCache();
        //consoleDump(now-cache[1]);
        if(!calledByTimeout)
          setTimeout("monitor.checkCache(true);", updateTimeout);
        //this.check();
      }
      else {
        this.check();
        setTimeout("monitor.checkCache(true);", updateTimeout);
        //consoleDump("ok " + (now-cache[1]));
      }
    }
  }
  else {
    this.check();
    setTimeout("monitor.checkCache(true);", updateTimeout);
  }
}

Monitor.prototype.loadCache = function(isNotNewWindow){
  provider = prefs.getCharPref('provider');
  cache = prefs.getCharPref('cache');

  cache = cache.split(";");
  this.usedVolume = cache[2];
  this.totalVolume = cache[3];
  if(cache[4] != '')
    this.remaining = cache[4];
  if(cache[5] != '')
    this.extraMessage = cache[5];
  if(cache[7] != '') // 6 is newData
    this.amountToPay = cache[7];

  //this.extraMessage += "(from cache)";
  
  if(isNotNewWindow == true)
    this.checkIfDataIsNew(true);
  else
    this.newData = false;
    
  this.notify();
}

Monitor.prototype.checkIfDataIsNew = function(checkCacheNewData){
  cache = prefs.getCharPref('cache');
  
  cache = cache.split(";");
  if(!checkCacheNewData)
  {
    if(this.usedVolume != cache[2] || this.totalVolume != cache[3])
      this.newData = true;
  }
  else
    this.newData = (cache[6] == "true");
}

Monitor.prototype.storeCache = function(){
  provider = prefs.getCharPref('provider');
  
  this.checkIfDataIsNew(false);
  
  cache = new Array();
  
  cache[0] = provider;
  cache[1] = new Date().getTime();
  cache[2] = this.usedVolume;
  cache[3] = this.totalVolume;
  cache[4] = this.remaining;
  cache[5] = this.extraMessage;
  cache[6] = this.newData;
  cache[7] = this.amountToPay;
  
  prefs.setCharPref('cache', cache.join(";"));
}

Monitor.prototype.clearCache = function(){
  prefs.setCharPref('cache', '');
}

