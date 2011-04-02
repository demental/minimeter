
function Mobistar(username, password) {
    this.username = username.indexOf('@') != -1 ? username.substr(0,username.indexOf('@')) : username;
    this.password = password;
    this.image = "mobistar.png";
    this.name = "Mobistar";
    this.url = "http://www.mobistar.be/www/showPage?aWebcURL=09_ApplicationInformation/01_Descriptions/info_conso.xml";
}

Mobistar.prototype = new Monitor();

Mobistar.prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = "portlet_login_6%7BactionForm.login%7D="+this.username+"&portlet_login_6%7BactionForm.password%7D="+this.password;
        http_post('https://www.mobistar.be/www/portal/public/residential?_nfpb=true&portlet_login_6_actionOverride=%2Fbe%2Fmobistar%2Fim%2Fprocess%2Fportlets%2Flogin001%2FprocessLogin&_windowLabel=portlet_login_6&_pageLabel=applicationAuthentication', postdata,this, 2);
				break;
      case 2:
        reply = unescape(reply);
        var regLangNotChosen=/images\/languagep.jpg/;
        if (regLangNotChosen.test(reply)) {
          http_get("http://www.mobistar.be/www/portal/public/residential?_nfpb=true&_pageLabel=guesthome&language=fr_BE&event=languageEvent", this, 1);
          break;
        }
        
        var regLoginok=/(Bienvenue|Welkom)/;
        if (!regLoginok.test(reply)) {
          this.badLoginOrPass();
          break;
        }
        http_get("http://www.mobistar.be/www/showPage?aWebcURL=09_ApplicationInformation/01_Descriptions/info_conso.xml", this, 3);
        break;
			case 3:
				var regUsedMB=/Vous avez consomm[\w&;]*\s*([0-9.]*) MB/;
				var regUsedGB=/Vous avez consomm[\w&;]*\s*([0-9.]*) GB/;
				var regUsedExceeded =/<strong>([0-9.]*) GB<\/strong>/;
				var regAmountToPay=/<strong>([0-9.]*)[\w&;]*EUR<\/strong>/;
				var regAllowed=/([0-9]*) GB./;
				var regDateEnd=/du[\w&;]*\s*([0-9]*)\//; // (17)/06/2007
        reply = unescape(reply);
			
        if((!regUsedMB.test(reply) && !regUsedGB.test(reply) && !regUsedExceeded.test(reply)) || !regAllowed.test(reply)){
          this.reportError();
          break;
        }
        else {
          var volumeUsed, volumeAllowed, dateEnd, month, amountToPay;
          if(regUsedMB.test(reply)) {
            volumeUsed = regUsedMB.exec(reply);
            volumeUsed =  Math.round(volumeUsed[1]/1024*1000) /1000;
          }
          else
            if(regUsedGB.test(reply)){
              volumeUsed = regUsedGB.exec(reply);
              volumeUsed = volumeUsed[1];
          }
          else {
            volumeUsed = regUsedExceeded.exec(reply);
            volumeUsed = volumeUsed[1];
            amountToPay = regAmountToPay.exec(reply);
            amountToPay = amountToPay[1];
            this.amountToPay = amountToPay + " EUR";
          }
          var volumeAllowed = regAllowed.exec(reply);
          this.usedVolume = volumeUsed*1;
          this.totalVolume = volumeAllowed[1]*1;
          
          dateEnd = regDateEnd.exec(reply);
          this.remainingDays = getInterval("nearestOccurence", dateEnd[1]);
          
          this.update(true);
        }
		}
}
