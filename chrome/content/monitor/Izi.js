
function Izi(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "izi.png";
    this.name = "iZi";
    this.url = "https://www.izi.re/moniZi/consommation.php#menu";
}

Izi.prototype = new Monitor();

Izi.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "login="+this.username+"&password="+this.password;
        http_post('https://www.izi.re/moniZi/login.php', postdata,this, 2);
				break;
      case 2:
         reply = decodeURIComponent(reply);
         var regErrorLogin=/Le Login et\/ou le Mot de passe que vous avez saisis sont incorrects/;
         if (regErrorLogin.test(reply)) {
           this.badLoginOrPass();
           break;
         }
         http_get("https://www.izi.re/moniZi/consommation.php", this, 3);
         break;
			case 3:
        reply = decodeURIComponent(reply);
				var regused=/>([0-9.]*) Go<\/td><\/tr><tr><td>/g;
				var regusedUnlimited=/>([0-9.]*) Go<\/td><\/tr>\s*<\/table>/;
				var regAllowed = /97.647058823529px;">([0-9]*) Go<\/div>/;
				var regDateEnd = /du ([0-9]*)[0-9\/]* au [0-9\/]*/;
				var volumeused;
				if (regused.test(reply))
          volumeused = regused.exec(reply);
				else
          if (regusedUnlimited.test(reply))
            volumeused = regusedUnlimited.exec(reply);
          else {
            this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }
        var volumeused = regused.exec(reply);
        if (!regAllowed.test(reply))
          this.totalVolume = 0;
        else {
          var volumetotal = regAllowed.exec(reply);
          this.totalVolume = volumetotal[1];
        }
        this.usedVolume = volumeused[1];
        if (regDateEnd.test(reply)){
          regDateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", regDateEnd[1]);
        }
        if (this.totalVolume != 0 && this.usedVolume > this.totalVolume) {
          this.amountToPay = Math.ceil(this.usedVolume - this.totalVolume)*3;
          if (this.amountToPay > 49.99)
            this.amountToPay = 49.99;
          this.amountToPay = this.amountToPay + " EUR";
        }
       
        this.update(true);
					
		}	
				
}
