function Constituencies(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.id = id;

	this.hex = new HexMap({'id':id,'width':w,'height':h,'size':13,'padding':padding});

	this.hex.load(file,{me:this},function(e){ e.data.me.loadResults("ge2017"); });

	function getLabel(e,title){
		var rs = {'SC':'Scotland','NI':'Northern Ireland','WA':'Wales','NE':'North East','NW':'North West','YH':'Yorkshire &amp; Humber','WM':'West Midlands','EM':'East Midlands','EA':'East Anglia','LO':'London','SE':'South East','SW':'South West'};

		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		if(e.data.builder.by == "ge2017") lbl = title+'<br />'+(e.data.hexmap.data['ge2017'][e.data.region] ? (e.data.hexmap.data['ge2017'][e.data.region].name+" - "+e.data.hexmap.data['ge2017'][e.data.region].partyname || 'Unknown') : 'Not yet known');
		else lbl = title+'<br />Region: '+rs[e.data.hexmap.mapping.hexes[e.data.region].a];
		return lbl;
	}	
	this.hex.on('mouseover',{'builder':this},function(e){
		e.data.builder.label(getLabel(e,this.attr('title')));
		this.attr('fill-opacity',0.75).attr('stroke-width',4.5);
		// Simulate a change of z-index by moving this element to the end of the SVG
		this.parent()[0].appendChild(this[0]);
	}).on('mouseout',function(e){
		S('.infobubble').remove();
		this.attr('fill-opacity',0.5).attr('stroke-width',1.5);
	}).on('click',{'builder':this},function(e){
		if(e.data.builder.by=="candidates"){
			location.href = "https://candidates.democracyclub.org.uk/election/parl.2017-06-08/post/WMC:"+e.data.region+"/";
		}else{
			e.data.hexmap.regionToggleSelected(e.data.region,true);
			e.data.builder.label(getLabel(e,this.attr('title')));
		}
	});
	
	
	this.label = function(l){
		if(S('.infobubble').length == 0) S('#'+this.id+'').after('<div class="infobubble"><div class="infobubble_inner"></div></div>');
		S('.infobubble_inner').html(l);
		return this;
	}

	this.saveable = (typeof Blob==="function");

	// Update text of button
	if(this.saveable){
		// Add event to button
		S('#save').on('click',{me:this},function(e){ e.data.me.save(); });
		// Add key binding
		S(document).on('keypress',function(e){
			if(e.originalEvent.charCode==109) S('#savesvg').trigger('click');     // M
			if(e.originalEvent.charCode==104) S('#save').trigger('click');     // H
		});

		// Add event to button
		S('#savesvg').on('click',{me:this},function(e){ e.data.me.saveSVG(); });

	}else{
		S('#save').css({'display':'none'});
		S('#savesvg').css({'display':'none'});
	}

	function updateClass(btn){
		S('.switchdata').addClass('b5-bg').removeClass('c10-bg');btn.removeClass('b5-bg').addClass('c10-bg');
	}
	// Add events to buttons for colour changing

	this.saveSVG = function(){

		// Make hex json
		var str = this.hex.paper.canvas.html();
		this.save(str,"map.svg",'text/application/svg+xml');

		return this;
	}

	this.save = function(str,file,type){

		// Make hex json

		if(!str) str = JSON.stringify(this.hex.mapping).replace(/\}\,/g,"},\n\t\t").replace(/\}\}\}/,"}\n\t\}\n\}").replace(/\"hexes\":{/,"\n\t\"hexes\": {\n\t\t").replace(/{"layout"/,"{\n\t\"layout\"");
		if(!file) file = "test.hexjson";
		if(!type) type = 'text/application/json';

		var textFileAsBlob = new Blob([str], {type:type});
		var fileNameToSaveAs = file;
	
		function destroyClickedElement(event){ document.body.removeChild(event.target); }
		var dl = document.createElement("a");
		dl.download = fileNameToSaveAs;
		dl.innerHTML = "Download File";
		if(window.webkitURL != null){
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			dl.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}else{
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			dl.href = window.URL.createObjectURL(textFileAsBlob);
			dl.onclick = destroyClickedElement;
			dl.style.display = "none";
			document.body.appendChild(dl);
		}
		dl.click();
		return this;
	}

	this.loadResults = function(type){
		if(!type) type = "ge2017";
		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};
		if(type == "ge2017"){
			S().ajax('results.json',{
				'complete':function(d){
					this.data["ge2017"] = d.results;
					this.hex.data["ge2017"] = this.data["ge2017"];
					this.setColours("ge2017");
					this.lastupdate = new Date(d.update);
					var n = 0;
					for(var i in d.results){
						n++;
					}
					S('#update').html("As of "+this.lastupdate.toLocaleTimeString());
					S('#summary').html(n+' of 650 results returned');

					this.getGender();
				},
				'this': this,
				'cache': false,
				'error':function(){},
				'dataType':'json'
			});
		}
		setTimeout(function(e){ e.loadResults("ge2017") },60000,this);
	}

	function getColour(pc,a,b){
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}
	function makeGradient(a,b){
		return 'background: '+a.hex+'; background: -moz-linear-gradient(left, '+a.hex+' 0%, '+b.hex+' 100%);background: -webkit-linear-gradient(left, '+a.hex+' 0%,'+b.hex+' 100%);background: linear-gradient(to right, '+a.hex+' 0%,'+b.hex+' 100%);';
	}


	this.setColours = function(type){
		if(!type) type = "region";
		this.by = type;
		if(type == "ge2017" && (!this.data || !this.data["ge2017"])) return this.loadResults("ge2017");

		var key = "";

		// Set the function for changing the colours
		if(type == "ge2017"){
			var names = {'Con':'Conservative','Lab':'Labour','LD':'Lib Dem','PC':'Plaid Cymru','Ind':'Independent','Spk':'Speaker','SF':'Sinn F&eacute;in','O':'Other'};
			var p = {'Con':'#2254F4','Lab':'#D60303','LD':'#F9BC26','SNP':'#FF6700','PC':'#1DD3A7','UKIP':'#722EA5','Green':'#0DBC37','DUP':'#4f4c9a','SDLP':'#fbb675','SF':'#b6c727','UUP':'#EF3AAB','O':'#999999','Ind':'#dfdfdf'};//,'Spk':'#909090'};
			var lookup = { 77: 'PC', '53': 'Lab', 52:'Con', 90:'LD', 63:'Green', 70:'DUP', 55:'SDLP',83:'UUP',102:'SNP',85:'UKIP', 39: 'SF' };
			this.updatetext = "";
			this.hex.setColours = function(region){
				r = this.data["ge2017"][region];
				if(typeof r =="undefined") return '#000';
				var party = (lookup[r.party] ? (names[lookup[r.party]] || lookup[r.party]) : 'Other');
				this.data["ge2017"][region].updated = (!this.data["ge2017"][region].partyname ? true : false);
				this.data["ge2017"][region].partyname = party;
				if(lookup[r.party]) return (p[lookup[r.party]] || '#000');
				else return p['O'];
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}
		
		S('#key').html((key ? key:''));

		this.hex.updateColours();

		return this;
	}
	
	this.getGender = function(){

		var _obj = this;
		var candidates;
	
		function gender(){
			results = _obj.data["ge2017"];

			var f = 0;
			var m = 0;
			var n = 0;
			for(var i in results){
				for(var j = 0; j < candidates[i].length; j++){
					if(candidates[i][j].n == results[i].name){
						if(candidates[i][j].g == "m") m++;
						if(candidates[i][j].g == "f") f++;
					}
				}
				n++;
			}

			return [m,f,n];
		}

		function showGenderSplit(){
			g = gender();
			S('#extra').html('MP gender split: '+(100*g[1]/g[2]).toFixed(1)+'% women');
		}

		if(!candidates){
			S().ajax('candidates.json',{'complete':function(d){
				candidates = JSON.parse(d);
				showGenderSplit();
			},'datatype':'json' })
		}else showGenderSplit();

		return this;
	}

	return this;
}


