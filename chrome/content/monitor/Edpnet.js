function Edpnet(username, password) {
    this.username = username.indexOf(',') != -1 ? username.substr(0,username.indexOf(',')) : username;
    this.password = password;
    this.image = "edpnet.png"; // does not belong in class
    this.name = "EDPnet";
    this.url = "http://www.edpnet.be/login.aspx";
    this.ligne = '';
    if(username.indexOf(",") > 0) {
      this.ligne = username.substr(username.indexOf(",")+1);
      this.url = "http://www.edpnet.be/maint_dslconnection.aspx?ID="+this.ligne;
    }
}

Edpnet.prototype = new Monitor();

Edpnet.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        http_get("http://www.edpnet.be/login.aspx", this, 2);
        break;
          
      case 2:
        reply = unescape(reply);
        var regViewstateID=/VIEWSTATE_ID" value="([0-9a-z-]*)"/;
        if (!regViewstateID.test(reply)) {
          this.reportError(step, this.name);
          break;
        }
        viewstateID = regViewstateID.exec(reply);
        var postdata = "__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE_ID="+viewstateID[1]+"&__VIEWSTATE=&tbUserID="+this.username+"&tbPassword="+this.password+"&btnLogin=Login";
        http_post('http://www.edpnet.be/login.aspx', postdata,this, 3);
        break;
          
      case 3:
        reply = unescape(reply);
        var regErrorLogin=/(Invalid user ID or password|Nom d'utilisateur ou mot de passe incorrect|Foutieve gebruikersnaam of wachtwoord)/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass("edpnet");
          break;
        }
        if (this.ligne == '')
          http_get("http://www.edpnet.be/list_dslconnections.aspx", this, 4);
        else
          http_get(this.url, this, 5);
        break;
          
      case 4:
        reply = unescape(reply);
        var regNumConn = /<img src='icons\/circle_green.gif'><\/td><td>&nbsp;[a-zA-Z0-9&#;]*<\/td><\/tr><\/table><\/td><td align="Center" valign="Top">\s*<a href='maint_dslconnection.aspx\?ID=([0-9]*)'/;
        if(!regNumConn.test(reply)) {
          this.reportError(step, this.name);
        }
        else {
          numConnection = regNumConn.exec(reply);
          this.url = "http://www.edpnet.be/maint_dslconnection.aspx?ID="+numConnection[1];
          http_get(this.url, this, 5);
        }
        break;
          
      case 5:
        reply = unescape(reply);
        var regUsed = /(Consommation en total \(Net\)|Totaal verbruik \(Netto\)|Total Consumption \(Net\))<\/td>\s*<td align="right">[0-9.,]*<\/td>\s*<td align="right">[0-9.,]*<\/td>\s*<td align="right">([0-9.,]*)<\/td>/;
        var regIncluded = /(Trafic compris \(gratuit\) |Inbegrepen \(gratis\) trafiek|Included \(Free\) Traffic):<\/td><td align="right">([0-9.]*)<\/td>/;
        var regAllowed = /(Trafic maximum autoris� en Mo|Maximum toegestane trafiek in MB|Maximum Allowed Traffic in MB):<\/td><td align="right">([0-9.]*)<\/td>/;
        var regBonus = /(Bonus d'anciennet� en Mo:|Getrouwheidsbonus in MB|Loyalty bonus in MB)<\/td><td align="right">([0-9.]*)<\/td>/;

        var regDateEnd = /([0-9]*)-[0-9]*-[0-9]*<\/b><\/span><\/td>/;
        
        if(!regUsed.test(reply) || (!regIncluded.test(reply) && !regAllowed.test(reply))){
          this.reportError(step, this.name);
          break;
        }
        
        var volumeused = regUsed.exec(reply);
        if (regIncluded.test(reply))
          var volumetotal = regIncluded.exec(reply);
        else
          var volumetotal = regAllowed.exec(reply);
        
        volumeused = volumeused[2].replace('.','').replace(',','.');
        volumetotal = volumetotal[2].replace('.','');
        
        if (regBonus.test(reply)) {
          bonus = regBonus.exec(reply);
          consoleDump (bonus[2]);
          bonus = bonus[2].replace('.','');
          volumetotal = volumetotal*1 + bonus*1;
        }

        this.usedVolume = (volumeused/1024).toFixed(3)*1;
        this.totalVolume = (volumetotal/1024).toFixed(3)*1;
        
        if(this.usedVolume > this.totalVolume)
          this.amountToPay = (Math.ceil(this.usedVolume - this.totalVolume)*0.25).toFixed(2) + " EUR";
        
        if( regDateEnd.test(reply) ){
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", regDateEnd[1]);
        }
        this.update(true);
    }
}

