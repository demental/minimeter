function Dommel(username, password) {
  this.username = username;
  this.password = password;
  this.image = "dommel.png";
  this.name = "Dommel";
  this.url = "https://crm.schedom-europe.net/index.php";
}

Dommel.prototype = new Monitor();

Dommel.prototype.check = function() {
  this.state = this.STATE_BUSY;
  this.notify();
  this.callback(1);
}

Dommel.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }
  
  switch(step)
  {
    default:
    case 1:
      var postdata = "op=login&username="+this.username+"&password="+this.password+"&new_language=english";
      http_post('https://crm.schedom-europe.net/index.php', postdata,this, 2);
      break;
    case 2:
      reply = unescape(reply);
      var regErrorLogin=/your login is incorrect|uw paswoord werd niet aanvaard/;
      if (regErrorLogin.test(reply)) {
        this.badLoginOrPass();
        break;
      }
      http_get('https://crm.schedom-europe.net/user.php?op=view&tile=mypackages', this, 3);
      break;
    case 3:
      reply = unescape(reply);
      var servid = /servid=([0-9]+)&/;
      var client_id = /client_id=([0-9]+)'/;
      var servidValue = servid.exec(reply);
      var client_idValue = client_id.exec(reply);
      if( !servid.test(reply) || !client_id.test(reply) ){
        this.reportError(step, this.name, escape(reply));
      } else {
        var servidValue = servid.exec(reply);
        var client_idValue = client_id.exec(reply);
        http_get("https://crm.schedom-europe.net/include/scripts/linked/dslinfo/dslinfo.php?servid="+servidValue[1]+"&password="+this.password+"&client_id="+client_idValue[1], this, 4);
      }
      break;
    case 4:
      reply = unescape(reply);
      
      var reg_homeconnect = /homeconnect/;
      var reg_connection_type = /<td><b>type :<\/b><\/td>\s*<td>(broadband|mediumband)<\/td>/;
      //var reg_broad_DL = /broadband download : ([0-9\.]+) gb/;
      //var reg_broad_UP = /broadband upload : ([0-9\.]+) gb/;
      var reg_broad_TOTAL = /total traffic downloaded in broadband: ([0-9\.]+) gb/;
      var reg_real_traffic = /<b>real traffic that was transferred <\/b> was<b> ([0-9\.]+) gb<\/b>/;
      var reg_real_upload = /your line nor the ([0-9\.]+) gb uploadtraffic/;
      //var reg_medium_DL = /medium\/smallband download : ([0-9\.]+) gb/;
      //var reg_medium_UP = /medium\/smallband upload : ([0-9\.]+) gb/;
      //var reg_medium_TOTAL = /total transferred in medium\/smallband : ([0-9\.]+) gb/;
      //var reg_overall = /overall transferred during the current period : ([0-9\.]+) gb/;
      var reg_broad_REMAINING = /remaining in broadband: <\/b>([0-9\.]+) gb/;
      var reg_remainingDays = /days remaining: ([0-9]+)/;
    
      if(reg_homeconnect.test(reply))
        this.setFlatRateWithoutInfos();
      else {
        
        if( !reg_connection_type.test(reply)) {
          this.reportError(step, this.name, escape(reply));
        } else {
          // Grab connection type (broadband|mediumband)
          var connection_typeValue = reg_connection_type.exec(reply);
          
          var gb; // Unit as selected in options and locale
          if (isUseSI())
              gb = getString("unitSI.GiB");
          else
              gb = getString("unit.GB");
          gb = " " + gb;
      
          // Grab remaining days before reset
          if( !reg_remainingDays.test(reply) ) {
            this.remainingDays = null;
          } else {
            var remainingDaysValue = reg_remainingDays.exec(reply);
            this.remainingDays = remainingDaysValue[1]*1;
          }
      
          // Grab common info to broadband & mediumband
          //var broad_DLValue = reg_broad_DL.exec(reply);
          //var broad_UPValue = reg_broad_UP.exec(reply);
          var broad_TOTALValue = reg_broad_TOTAL.exec(reply);  
          var real_traffic = 0;
          var real_upload = 0;
          if( reg_real_traffic.test(reply) ) {
            var real_trafficValue = reg_real_traffic.exec(reply);
            real_traffic= real_trafficValue[1]*1;
          } 
          if( reg_real_upload.test(reply) ) {
            var real_uploadValue = reg_real_upload.exec(reply);
            real_upload= real_uploadValue[1]*1;
          }
  
          // Grab info in broadband
          if( connection_typeValue[1] == "broadband") {
        
            // Grab remaining volume before mediumband
            var remainingVolume = 0;
            if( reg_broad_REMAINING.test(reply) ) {
              var broad_REMAININGValue = reg_broad_REMAINING.exec(reply);
              remainingVolume = broad_REMAININGValue[1]*1;
            }
      
            //var down = broad_DLValue[1]*1;
            //var up = broad_UPValue[1]*1;
            this.usedVolume = broad_TOTALValue[1]*1;
            this.totalVolume = this.usedVolume + remainingVolume;
            //this.extraMessage = "Download: " + down.toFixed(2) +" GB, Upload: " + up.toFixed(2) +" GB";
            this.extraMessage = "Counted Traffic: " + (this.usedVolume).toFixed(2) + gb + "\nTotal Traffic: " + real_traffic.toFixed(2) + gb + " (Upload: " + real_upload.toFixed(2) + gb + ")\nConnection type : " + connection_typeValue[1];
            http_get('https://crm.schedom-europe.net/index.php?op=logout', this, 5);
          }
          // Grab info in mediumband
          else if( connection_typeValue[1] == "mediumband") {
            //var medium_DLValue = reg_medium_DL.exec(reply);
            //var medium_UPValue = reg_medium_UP.exec(reply);
            //var medium_TOTALValue = reg_medium_TOTAL.exec(reply);
            //var overallValue = reg_overall.exec(reply);
      
            //var down1 = broad_DLValue[1]*1;
            //var up1 = broad_UPValue[1]*1;
            //var down2 = medium_DLValue[1]*1;
            //var up2 = medium_UPValue[1]*1;
            //var overall = overallValue[1]*1;
            //this.usedVolume = broad_TOTALValue[1]*1 + medium_TOTALValue[1]*1;
            //this.totalVolume = this.usedVolume;
            //this.extraMessage = "Broadband download : " + down1.toFixed(2) +" GB, Up: " + up1.toFixed(2) +" GB\n" + "Mediumband download : " + down2.toFixed(2) +" GB, Up: " + up2.toFixed(2) +" GB\n" + "Overall transfer : " + overall.toFixed(2) +" GB";
      
            this.usedVolume = broad_TOTALValue[1]*1;
            this.totalVolume = this.usedVolume;
            this.extraMessage = "Counted Traffic: " + (this.usedVolume).toFixed(2) + gb + " (Real: " + real_traffic.toFixed(2) + gb + ")\nConnection type : " + connection_typeValue[1];
            http_get('https://crm.schedom-europe.net/index.php?op=logout', this, 5);
          } else {
            this.reportError(step, this.name, escape(reply));
          }
        }
        break;
      }
    case 5:
      this.update(true);
  }   
}
