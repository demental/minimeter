function Orange3g(username, password) {
    this.username = username;
    this.password = password;
    this.image = "orange3g.png"; // does not belong in class
    this.name = "Orange 3G";
    this.url = "http://r.orange.fr/r/Omoncomptemobile_suiviconso";
}

Orange3g.prototype = new Monitor();

Orange3g.prototype.callback = function(step, reply) {

  if(this.aborted()){
    return;
  }

    switch(step)
    {
      default:
      case 1:
        var postdata = "credential="+this.username+"&pwd="+this.password;
        http_post('http://id.orange.fr/auth_user/bin/auth_user.cgi?action=valider&origin=rs', postdata,this, 2);
        break;
        
      case 2:
        reply = decodeURIComponent(reply);
        var regErrorLogin=/saisie incorrecte/;
        if (regErrorLogin.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get("http://r.orange.fr/r/Omoncomptemobile_suiviconso", this, 3);
        break;
        
      case 3:
        reply = decodeURIComponent(reply);
        var regTotal = /Disponible initial<!--]--><\/th>\s*<td class="orange2 centre">([0-9,]*) Mo<\/td>/;
        var regUsed = /Consomm�<!--]--><\/th>\s*<td class="orange2 centre">([0-9,]*) Mo<\/td>/
        var regDateEnd = /Prochaine facturation<!--]--><\/th>\s*<td class="orange2 centre">([0-9]*)/
       
        if(!regTotal.test(reply) || !regUsed.test(reply)){
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        var volumeTotal = 0;
        var volumeUsed = 0;
       
        volumeTotal = regTotal.exec(reply);
        volumeUsed = regUsed.exec(reply);
          
        volumeTotal = volumeTotal[1].replace(",", ".");
        volumeUsed = volumeUsed[1].replace(",", ".");
        
        this.totalVolume = Math.round(volumeTotal/1.024)/1000;
        this.usedVolume = Math.round(volumeUsed/1.024)/1000;
        
        if(regDateEnd.test(reply)){
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", regDateEnd[1]*1+1);
        }
        this.update(true);
        break;
    }
}
