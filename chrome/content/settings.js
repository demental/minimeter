		/*
			"Classname:Realname"
			_ = country
			# = custom capacity
			* = no password required
		*/
  var monitors = new Array(
                            "_Australia", "aaNet", "iiNet", "Internode",
                            "_Belgium", "Starsadsl:3Stars ADSL", "ADSL20", "Tele2:Base", "Belcenter", "Skynet:Belgacom", "Clearwire", "#Destiny", "Dommel", "dxADSL", "Eleven:E-leven", "EDPnet", "Euphony", "FullADSL", "HappyMany", "Mobistar", "Mobistariew:Mobistar Internet Everywhere", "*Coditel:Numericable", "Scarlet", "Telenet", "Tvcablenet", "Voo", 
                            "_Bosnia and Herzegovina","Monet",
                            "_Canada","#*Videotron:Vidéotron",
                            "_Czech Republic", "#Karneval", "#Chello", "InternetExpres", "#Gtsnovera:GTS Novera",
                            "_France","#Bouygues:Bouygues Telecom", "iZi", "Orange","Orange3g:Orange 3G", "Sat2way",
                            "_Germany","#Tmobile:T-Mobile",
                            "_New Zealand", "Vodaphonenz:Vodaphone", "Xtra",
                            "_Russia", "Omsk:Omsk TeleCommunications",
                            "_South Africa", "Cybersmart", "Iburst", "#Internetsolutions:Internet Solutions", "#Saix:Saix ISPs", "#Mweb",
                            "_Turkey", "#Turk:Türk Telekom",
                            "_United Kingdom", "Bt",
                            "_United States", "Comcast"
                            );
                            

  var credentials = null;
  var obj = null;
  
  function initialize_settings()
  {
    fillProviders();
    
    if(window.arguments != null){
      obj = window.arguments[0];
    }

    credentials = new Minimeter.Credentials("chrome://minimeter/");
    initOptions();
    document.getElementById("username").focus();
  }		
  
  function setOptions()
  {
    try{
      var username = document.getElementById("username").value;
      if(username == "") {
        alert(Minimeter.getString("error.emptyUsername", "A username can't be empty"));
        return false;
      }
      
      var capacity = document.getElementById('capacity').value;
      
      if (!document.getElementById('provider').selectedItem.hasAttribute('capacity'))
        capacity = "10";
        
      if(document.getElementById('flatrate').checked && capacity == "") {
        if(capacity == "")
          capacity = 0;
      }
      else {
        capacity = capacity.replace(",",".");
        if(!parseFloat(capacity)){
          alert(Minimeter.getString("error.capacityDecimal", "The capacity should be a decimal"));
          return false;
          capacity = parseFloat(capacity);
        }
      }
      if(!document.getElementById('flatrate').checked && capacity <= 0){
        alert(Minimeter.getString("error.capacityNotZero", "The capacity should be greater than 0 Gigabyte"));
        return false;
      } 
      var provider = document.getElementById('provider')
      if(monitors[provider.selectedIndex][0] == "_"){
        alert(Minimeter.getString("error.ispCountry", "You can't select a country as ISP"));
        return false;
      }
      var textToReplace = document.getElementById('textToReplace').value;
      if (textToReplace == " ")
        textToReplace = "";
      
      Minimeter.prefs.setIntPref("updateTimeout", 
          Math.round(document.getElementById('updateTimeout').value.replace(",",".")) * 60);
      Minimeter.prefs.setBoolPref("showtext", 
          document.getElementById('showtext').checked);
      Minimeter.prefs.setBoolPref("showmeter", 
          document.getElementById('showmeter').checked);
      Minimeter.prefs.setBoolPref("showicon", 
          document.getElementById('showicon').checked);
      Minimeter.prefs.setBoolPref("useSI", 
          document.getElementById('useSI').checked);
      Minimeter.prefs.setBoolPref("showRemainingDays", 
          document.getElementById('showRemainingDays').checked);
      Minimeter.prefs.setBoolPref("showAmountToPay", 
          document.getElementById('showAmountToPay').checked);
      Minimeter.prefs.setBoolPref("showRemainingAverage", 
          document.getElementById('showRemainingAverage').checked);
      Minimeter.prefs.setCharPref("provider", provider.value);
      Minimeter.prefs.setCharPref("capacitychar", capacity);
      Minimeter.prefs.setBoolPref("sendDebug", 
          document.getElementById('sendDebug').checked);
      Minimeter.prefs.setCharPref("textToReplace", textToReplace);
      credentials.store(
          username ,
          document.getElementById("password").value);  
      
      if(obj != null) {
        obj.check();
      }

  }
  catch(e){
    alert(e); 
    return false;
  }
   
    return true; 
  }
  
  function initOptions()
  {
    var sendDebug = Minimeter.prefs.getBoolPref('sendDebug');
    var textToReplace = Minimeter.prefs.getCharPref('textToReplace');
    var updateTimeout = Minimeter.prefs.getIntPref('updateTimeout');
    var showtext = Minimeter.prefs.getBoolPref('showtext');
    var showmeter = Minimeter.prefs.getBoolPref('showmeter');
    var showicon = Minimeter.prefs.getBoolPref('showicon');
    var useSI = Minimeter.prefs.getBoolPref('useSI');
    var showRemainingDays = Minimeter.prefs.getBoolPref('showRemainingDays');
    var showAmountToPay = Minimeter.prefs.getBoolPref('showAmountToPay');
    var showRemainingAverage = Minimeter.prefs.getBoolPref('showRemainingAverage');
    var provider = Minimeter.prefs.getCharPref('provider');
    var capacity;
    try {
      capacity = Minimeter.prefs.getIntPref('capacity');
      Minimeter.prefs.setCharPref('capacitychar',capacity);
      Minimeter.prefs.clearUserPref('capacity');
    }
    catch(e) {}
    
    capacity = Minimeter.prefs.getCharPref('capacitychar');
    
    document.getElementById('sendDebug').checked = sendDebug;
    document.getElementById('textToReplace').value = textToReplace;
    document.getElementById('updateTimeout').value = updateTimeout /60;
    document.getElementById('showtext').checked = showtext;
    document.getElementById('showmeter').checked = showmeter;
    document.getElementById('showicon').checked = showicon;
    document.getElementById('useSI').checked = useSI;
    document.getElementById('showRemainingDays').checked = showRemainingDays;
    document.getElementById('showAmountToPay').checked = showAmountToPay;
    document.getElementById('showRemainingAverage').checked = showRemainingAverage;
    document.getElementById('provider').value = provider;
    

    if(capacity <= 0) setFlatrate(true); else {
      
      document.getElementById('capacity').value = capacity;

    }
    
    var user = credentials.load();
    document.getElementById("username").value=  user.username;
    document.getElementById("password").value=  user.password;
    
    updateForm();
  }
  
  function fillProviders(){
    var list = document.getElementById("provider").getElementsByTagName("menupopup")[0];
    for(var i=0; i < monitors.length; i++){
      var m = monitors[i];
      var isp = document.createElement("menuitem");
      if(m[0] == "_"){
        isp.setAttribute( "class" , "menuitem-head");
        isp.setAttribute( "label" , m.substr(1));
        isp.setAttribute( "disabled" , "true");
      } else {   
        if(m[0] == "#"){
          isp.setAttribute( "capacity" , true);
          m = m.substr(1);
        }
        if(m[0] == "*"){
          isp.setAttribute( "password" , true);
          m = m.substr(1);
        }
        var ml = m.split(":")[0].toLowerCase();
            
        if(!m.split(":")[1]) m = m.split(":")[0]; else m = m.split(":")[1];
        isp.setAttribute( "label" , m);
        isp.setAttribute( "value" , ml);
        isp.setAttribute( "src" , "chrome://minimeter/content/res/" + ml + ".png"); // < Firefox 3
        isp.setAttribute( "image" , "chrome://minimeter/content/res/" + ml + ".png"); // >= Firefox 3
        isp.setAttribute( "style" , "background-image: url(chrome://minimeter/content/res/" + ml + ".png) !important");
      }
      list.appendChild(isp);
    }
/*

    var clist = document.getElementById("capacity").getElementsByTagName("menupopup")[0];
    //var capacities = new Array(5, 10, 30, 50);
    
    for(i=2; i <= 30; i++){
      isp = document.createElement("menuitem");
      isp.setAttribute( "label" , i + " GB");
      isp.setAttribute( "value" , i);
      isp.setAttribute( "style" , "width: 20px !important; float:left; ");
      clist.appendChild(isp);
    }
  */	
  }
  
  function updateForm(){
    
    var extrafield = document.getElementById('provider').selectedItem.hasAttribute('capacity');
    document.getElementById('capacityrow').setAttribute('hidden', !extrafield );
    if(!extrafield){
      document.getElementById('flatratedesc').hidden = true;
    } else {
      setFlatrate (document.getElementById('flatrate').checked );
    }
    var passwordfield = document.getElementById('provider').selectedItem.hasAttribute('password');
    document.getElementById('passwordrow').setAttribute('hidden', passwordfield );
  }

	function setFlatrate(val){
		capacity = Minimeter.prefs.getCharPref('capacitychar');
		
		var field = document.getElementById('capacity');
		if(val) field.setAttribute("disabled", true); else field.removeAttribute("disabled");
		if(val) field.value = ""; else field.value = capacity;
		document.getElementById('flatrate').checked = val;
		if(val)
      document.getElementById('showmeter').checked = !val;
	
		document.getElementById('flatratedesc').hidden = !val;
	}
	
  function moreInfo() {
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    var nsIWM = Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator);
    var myWindow = nsIWM.getMostRecentWindow("navigator:browser");
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
    var browserprefs = prefService.getBranch("general.useragent.");
    var locale = browserprefs.getCharPref('locale');
    var url;
    if (locale == "fr")
      url = "http://extensions.geckozone.org/Minimeter#correction";
    else
      url = "http://extensions.geckozone.org/Minimeter-en#correction";
    
    if (myWindow) {
      var newTab = myWindow.getBrowser().addTab(url);
      myWindow.getBrowser().selectedTab = newTab;
      //myWindow.content.focus();
    } else {
      window.opener.open(url);
    }
    window.self.focus();
  }
