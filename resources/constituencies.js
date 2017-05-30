function Constituencies(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.id = id;

	this.hex = new HexMap({'id':id,'width':w,'height':h,'size':16,'padding':padding});

	this.hex.load(file,{me:this},function(e){ e.data.me.setColours("region"); });

	function getLabel(e,title){
		var rs = {'SC':'Scotland','NI':'Northern Ireland','WA':'Wales','NE':'North East','NW':'North West','YH':'Yorkshire &amp; Humber','WM':'West Midlands','EM':'East Midlands','EA':'East Anglia','LO':'London','SE':'South East','SW':'South West'};
		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		if(e.data.builder.by == "population") lbl = title+'<br />Population: '+e.data.pop;
		else if(e.data.builder.by == "party") lbl = title+'<br />Party: '+e.data.hexmap.data['2015'][e.data.region];
		else if(e.data.builder.by == "referendum") lbl = title+'<br />Estimated leave vote: '+(e.data.hexmap.data['referendum'][e.data.region] ? Math.round(e.data.hexmap.data['referendum'][e.data.region]*100)+'%':'unknown');
		else if(e.data.builder.by == "candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['candidates'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong><!--<a href="https://candidates.democracyclub.org.uk/person/'+c[i].i+'">-->'+c[i].n+'<!--</a>--></strong> - '+c[i].p;
			}
		}else if(e.data.builder.by == "gender"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['gender'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong>'+c[i].n+'</strong> - '+c[i].p+' ('+(c[i].g=="f" ? "Female" : (c[i].g=="m" ? "Male":"Unknown/diverse"))+')';
			}
		}else lbl = title+'<br />Region: '+rs[e.data.hexmap.mapping.hexes[e.data.region].a];
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
	S('#colour-pop').on('click',{me:this},function(e){ e.data.me.setColours('population'); updateClass(this); });
	S('#colour-reg').on('click',{me:this},function(e){ e.data.me.setColours('region'); updateClass(this); });
	S('#colour-pty').on('click',{me:this},function(e){ e.data.me.setColours('party'); updateClass(this); });
	S('#colour-ref').on('click',{me:this},function(e){ e.data.me.setColours('referendum'); updateClass(this); });
	S('#colour-can').on('click',{me:this},function(e){ e.data.me.setColours('candidates'); updateClass(this); });
	S('#colour-gen').on('click',{me:this},function(e){ e.data.me.setColours('gender'); updateClass(this); });

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
		if(!type) type = "2015";

		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};
		if(type == "referendum"){
			S().ajax('data/2016referendum-estimates.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[1];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("referendum");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});
		}else if(type == "candidates" || type == "gender"){
			S().ajax('data/2017ge-candidates.json',{
				'complete':function(d){
					this.data["candidates"] = d;
					this.hex.data["candidates"] = this.data["candidates"];
					this.setColours("candidates");
					this.data["gender"] = d;
					this.hex.data["gender"] = this.data["gender"];
					this.setColours("gender");
				},
				'this': this,
				'error':function(){},
				'dataType':'json'
			});
		}else{
			S().ajax('data/2015results.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[1];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("party");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});
		
		}
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
		if(type == "party" && (!this.data || !this.data["2015"])) return this.loadResults("2015");
		if(type == "referendum" && (!this.data || !this.data["referendum"])) return this.loadResults("referendum");
		if(type == "candidates" && (!this.data || !this.data["candidates"])) return this.loadResults("candidates");
		if(type == "gender" && (!this.data || !this.data["gender"])) return this.loadResults("gender");

		var key = "";

		// Set the function for changing the colours
		if(type == "population"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var min = 50000;
			var max = 80000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].p - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+min+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+max;
		}else if(type == "party"){
			var names = {'Con':'Conservative','Lab':'Labour','LD':'Lib Dem','PC':'Plaid Cymru','Ind':'Independent','Spk':'Speaker'};
			var p = {'Con':'#2254F4','Lab':'#D60303','LD':'#F9BC26','SNP':'#FF6700','PC':'#1DD3A7','UKIP':'#722EA5','Green':'#0DBC37','DUP':'#4f4c9a','SDLP':'#fbb675','SF':'#b6c727','UUP':'#EF3AAB','Ind':'#dfdfdf','Spk':'#909090'};
			this.hex.setColours = function(region){
				r = this.data["2015"][region];
				return (p[r] || '#000');
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}else if(type == "referendum"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#2254F4');
			this.hex.setColours = function(region){
				return getColour(1 - (this.data["referendum"][region]-0.2)/0.6,a,b);
			}
			key = 'leave<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>remain';
		}else if(type == "candidates"){
			var levels = {0:'#2254F4',1:'#178CFF',2:'#00B6FF',3:'#08DEF9',4:'#1DD3A7',5:'#67E767',6:'#F9BC26'};
			this.hex.setColours = function(region){
				var n = this.data["candidates"][region].length;
				var c = '#2254F4';
				if(n > 0) c = (levels[n] || levels[6]);
				return c;
			}
			key = '0';
			for(var n in levels){
				key += '<span style="background-color:'+levels[n]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>';
			}
			key += '&ge;6';
		}else if(type == "gender"){
			var b = new Colour('#0DBC37');
			var a = new Colour('#722EA5');
			this.hex.setColours = function(region){
				var m = 0;
				var f = 0;
				for(var i = 0; i < this.data["gender"][region].length; i++){
					if(this.data["gender"][region][i].g=="f") f++;
					if(this.data["gender"][region][i].g=="m") m++;
				}
				var t = m + f;
				this.data["gender"][region].ratio = (t > 0 ? (m/(m+f)) : 0.5);
				return getColour(this.data["gender"][region].ratio,a,b);
			}
			key = 'male<span style="'+makeGradient(b,a)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>female';

		}else if(type == "region"){
			var names = {'YH':'Yorkshire and Humber','EM':'East Midlands','WM':'West Midlands','EA':'East Anglia','NI':'Northern Ireland','WA':'Wales','NW':'North West','NE':'North East','SE':'South East','SW':'South West','SC':'Scotland','LO':'London'};
			var rs = {'YH':'#F9BC26','EM':'#00B6FF','WM':'#E6007C','EA':'#FF6700','SC':'#2254F4','NI':'#722EA5','WA':'#0DBC37','NW':'#1DD3A7','NE':'#D60303','SW':'#178CFF','LO':'#D73058','SE':'#67E767'};
			this.hex.setColours = function(region){
				var r = this.mapping.hexes[region].a;
				return (rs[r] || this.colour.on);
			}
			for(var r in rs){
				key += '<span style="background-color:'+rs[r]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[r] || r);
			}
		}
		
		S('#key').html((key ? key:''));

		this.hex.updateColours();

		return this;
	}
	
	return this;

}