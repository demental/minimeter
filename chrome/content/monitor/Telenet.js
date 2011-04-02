
Minimeter.Telenet = function(username, password) {
    this.username = username;
    this.password = password;
    this.image = "telenet.png"; 
    this.name = "Telenet";
}

Minimeter["Telenet"].prototype = new Minimeter.Monitor();

Minimeter["Telenet"].prototype.callback = function(step, reply) {
    if(this.aborted()){
      return;
    }

		switch(step)
		{
			default:
			case 1:
        var postdata = '<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:enc="http://schemas.xmlsoap.org/soap/encoding/" env:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xs="http://www.w3.org/1999/XMLSchema" xmlns:xsi="http://www.w3.org/1999/XMLSchema-instance"><env:Header/><env:Body><getUsage xmlns="partns"><string xsi:type="xs:string">'+this.username+'</string><string0 xsi:type="xs:string">'+this.password+'</string0></getUsage></env:Body></env:Envelope>';
        Minimeter.http_post('https://telemeter4tools.services.telenet.be/TelemeterService', postdata,this, 2, null, "text/xml; charset=UTF-8");
				break;
      case 2:
        reply = decodeURIComponent(reply);
        
        reply = reply.replace(/&lt;/g,"<");
        reply = reply.replace(/&gt;/g,">");
        
        var regAllowed = /<limits><max-up>([0-9]*)<\/max-up>/;
        var regUsed = /<totalusage><up>([0-9.]*)<\/up>/;
        var regDateEnd = /<usage day="([0-9]*)">/;
        var regError = /<status>([^�]*)<\/status>/;
        
        if (!regError.test(reply)) {
          this.reportError(step, this.name, encodeURIComponent(reply));
          break;
        }
        
        var errorMessage = regError.exec(reply);
        
        if (errorMessage[1] == "OK") {
        
          if (!regAllowed.test(reply) || !regUsed.test(reply) || !regDateEnd.test(reply)) {
            this.reportError(step, this.name, encodeURIComponent(reply));
            break;
          }
        
          var volumeused = regUsed.exec(reply);
          var volumetotal = regAllowed.exec(reply);
          var dateEnd = regDateEnd.exec(reply);
          
          this.totalVolume = Math.round(volumetotal[1]/1024*1000)/1000;
          this.usedVolume = Math.round(volumeused[1]/1024*1000)/1000;
          
          dateEnd = dateEnd[1].substr(6, 2);
          this.remainingDays = Minimeter.getInterval("nearestOccurence", dateEnd);
        }
        
        /* Service error. */
        else {
        
          errorMessage = errorMessage[1].split(":");
          errorMessage[2] = errorMessage[2].replace(/\s/g,"");
          
          
          /* Too much requests (more than 2) for the last 60 minutes */
          if (errorMessage[2] == "ERRTLMTLS_00003") {
            this.errorMessage = "Expiry time not reached, please check later";
          }
            
          /* Incorrect Login or Password */
          else
           if (errorMessage[2] == "ERRTLMTLS_00004" || errorMessage[2] == "ERRTLMTLS_00002")
            this.badLoginOrPass();
          
          /* Another error. */
          else {
            this.errorMessage = "Webservice error : " + errorMessage[4];
            Minimeter.consoleDump(errorMessage[2] + " " + errorMessage[4]);
            this.reportError(step, this.name, encodeURIComponent(reply));
          }
        }      
      
        this.update (!this.errorMessage);
		}
}
