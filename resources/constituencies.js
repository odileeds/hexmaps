function Constituencies(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.id = id;
	this.type = S('#data-selector')[0].value;
	this.defaulttype = this.type;

	// Use the search string to pick a parameter to display
	var t = location.search.replace(/\?/,"");
	if(t){
		// Check if this is in the list
		var options = S('#data-selector option');
		var ok = false;
		var v = "";
		for(var i = 0; i < options.length; i++){
			if(options[i].getAttribute('value')==t){
				ok = true;
			}
		}
		if(ok){
			S('#data-selector')[0].value = t;
			this.type = t;
		}
	}

	// Create a hex map
	this.hex = new HexMap({'id':id,'width':w,'height':h,'size':16,'padding':padding});

	// Do we update the address bar?
	this.pushstate = !!(window.history && history.pushState);

	// Add "back" button functionality
	var _obj = this;
	if(this.pushstate){
		window[(this.pushstate) ? 'onpopstate' : 'onhashchange'] = function(e){
			if(e.state && e.state.type) _obj.setColours(e.state.type);
			else _obj.setColours(_obj.defaulttype)
		};
	}

	this.hex.load(file,{me:this},function(e){
		e.data.me.setType(e.data.me.type);
	});
	
	this.setType = function(t){

		// Update the history
		if(this.pushstate) history.pushState({type:t},"Hexes",(t==this.defaulttype ? '' : '?'+t));

		// Set the colours
		this.setColours(t);
		
		return this;
	}

	function getLabel(e,title){
		var rs = {'SC':'Scotland','NI':'Northern Ireland','WA':'Wales','NE':'North East','NW':'North West','YH':'Yorkshire &amp; Humber','WM':'West Midlands','EM':'East Midlands','EA':'East Anglia','LO':'London','SE':'South East','SW':'South West'};
		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		var cls = "";
		if(e.data.builder.by == "population"){
			lbl = title+'<br />Population: '+e.data.pop;
		}else if(e.data.builder.by == "electorate"){
			lbl = title+'<br />Electorate: '+e.data.electorate;
		}else if(e.data.builder.by == "GE2015-results"){
			lbl = title+'<br />Party: '+e.data.hexmap.data['GE2015-results'][e.data.region];
		}else if(e.data.builder.by == "GE2017-results"){
			r = e.data.hexmap.data['constituency-card'][e.data.region];
			cls = "generalelection";
			lbl = '<div><img src="'+r['photo_url']+'" /></div><div><strong>'+title+'</strong><br /><strong>MP:</strong> <a href="'+r['mysocuri']+'">'+r['dispname']+'</a>, '+r['partynow']+'<br /><strong>Area:</strong> '+r['sq_km']+'km&sup2; ('+r['sq_mi']+' miles&sup2;)<br /><strong>Distance from power:</strong> '+r['km_fr_pow']+' km ('+r['mi_fr_pow']+' miles)'+(r['result17'] ? '<br /><strong>2017 turnout:</strong> '+r['turnout17']+'% ('+r['valid17']+'/'+r['elect17']+')<table><tr></tr></table>' : '')+'</div>';
		}else if(e.data.builder.by == "GE2017-turnout"){
			r = e.data.hexmap.data['constituency-card'][e.data.region];
			cls = "generalelection";
			lbl = '<div><img src="'+r['photo_url']+'" /></div><div><strong>'+title+'</strong><br /><strong>MP:</strong> <a href="'+r['mysocuri']+'">'+r['dispname']+'</a>, '+r['partynow']+'<br /><strong>Area:</strong> '+r['sq_km']+'km&sup2; ('+r['sq_mi']+' miles&sup2;)<br /><strong>Distance from power:</strong> '+r['km_fr_pow']+' km ('+r['mi_fr_pow']+' miles)'+(r['result17'] ? '<br /><strong>2017 turnout:</strong> '+r['turnout17']+'% ('+r['valid17']+'/'+r['elect17']+')<table><tr></tr></table>' : '')+'</div>';
		}else if(e.data.builder.by == "referendum"){
			lbl = title+'<br />Estimated leave vote: '+(e.data.hexmap.data['referendum'][e.data.region] ? Math.round(e.data.hexmap.data['referendum'][e.data.region]*100)+'%':'unknown');
		}else if(e.data.builder.by == "benefits"){
			lbl = '<strong>'+title+'</strong><br />Percentage of constituency on income-based<br />benefits (IS/JSA/ESA): <strong>'+(e.data.hexmap.data['benefits'][e.data.region] ? (parseFloat(e.data.hexmap.data['benefits'][e.data.region]).toFixed(2))+'%':'unknown')+'</strong>';
		}else if(e.data.builder.by == "GE2017-candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['GE2017-candidates'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong><!--<a href="https://candidates.democracyclub.org.uk/person/'+c[i].i+'">-->'+c[i].n+'<!--</a>--></strong> - '+c[i].p;
			}
		}else if(e.data.builder.by == "GE2019-candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['GE2019-candidates'][e.data.region];
			if(c){
				for(var i = 0; i < c.length; i++){
					lbl += '<br /><strong><!--<a href="https://candidates.democracyclub.org.uk/person/'+c[i].id+'">-->'+c[i].name+'<!--</a>--></strong> - '+c[i].party_name;
				}
			}
			lbl += '<br /><div style="font-size:0.8em;color:#999;margin-top:16px;border-top:1px solid black;">Missing candidates? <a href="https://candidates.democracyclub.org.uk/election/parl.2019-12-12/post/WMC:'+e.data.region+'">Add them to Democracy Club.</a></div>'
		}else if(e.data.builder.by == "gender"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['gender'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong>'+c[i].n+'</strong> - '+c[i].p+' ('+(c[i].g=="f" ? "Female" : (c[i].g=="m" ? "Male": (c[i].g ? "Diverse":"Unknown")))+')';
			}
		}else lbl = title+'<br />Region: '+rs[e.data.hexmap.mapping.hexes[e.data.region].a];
		return {'label':lbl,'class':cls};
	}
	this.hex.on('mouseover',{'builder':this},function(e){
		this.attr('fill-opacity',0.75).attr('stroke-width',4.5);
		// Simulate a change of z-index by moving this element to the end of the SVG
		this.parent()[0].appendChild(this[0]);
	}).on('mouseout',function(e){
		this.attr('fill-opacity',0.5).attr('stroke-width',1.5);
	}).on('click',{'builder':this},function(e){
		if(e.data.builder.by=="GE2017-candidates"){
			location.href = "https://candidates.democracyclub.org.uk/election/parl.2017-06-08/post/WMC:"+e.data.region+"/";
		}else{
			var previous = e.data.hexmap.selected;
			var current = e.data.region;
			if(previous && current == previous) e.data.hexmap.regionToggleSelected(previous,true);
			else e.data.hexmap.selectRegion(e.data.region);
			if(!e.data.hexmap.selected) S('.infobubble').remove();
			else e.data.builder.label(e,this.attr('title'));
		}
	});

	this.label = function(e,title){
		l = getLabel(e,title);
		if(S('.infobubble').length == 0) S('#'+this.id+'').after('<div class="infobubble"><div class="infobubble_inner"></div></div>');
		S('.infobubble_inner').html(l.label).css({'width':(l.w ? l.w+'px':''),'height':(l.h ? l.h+'px':'')});
		S('.infobubble').attr('class','infobubble'+(l['class'] ? ' '+l['class'] : ''));
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

	// Add events to buttons for colour changing
	S('#data-selector').on('change',{me:this},function(e){
		e.data.me.setType(e.currentTarget.selectedOptions[0].getAttribute('value'));
		S(e.currentTarget).removeClass('c10-bg').addClass('b5-bg');
		S(e.currentTarget.selectedOptions[0]).addClass('c10-bg').removeClass('b5-bg');
	});

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
		if(!type) type = "GE2015-results";

		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};
		if(type == "referendum"){
			S().ajax('../data/2016referendum-estimates.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = parseFloat(c[1]);
					}
					this.hex.data[type] = this.data[type];
					this.setColours("referendum");
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		}else if(type == "GE2017-candidates" || type == "gender"){
			S().ajax('../data/2017ge-candidates.json',{
				'type': type,
				'complete':function(d,attr){
					this.data["GE2017-candidates"] = d;
					this.hex.data["GE2017-candidates"] = this.data["GE2017-candidates"];
					this.setColours("GE2017-candidates");
					this.data["gender"] = d;
					this.hex.data["gender"] = this.data["gender"];
					this.setColours(attr['type']);
				},
				'this': this,
				'error':function(){},
				'dataType':'json'
			});
		}else if(type == "benefits"){
			S().ajax('../data/2017benefits.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/g,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[8];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("benefits");
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		}else if(type == "constituency-card" || type == "GE2017-results" || type == "GE2017-turnout"){
			S().ajax('https://raw.githubusercontent.com/alasdairrae/wpc/master/files/wpc_2019_flat_file_v9.csv',{
				'complete':function(d){
					var data = CSV2JSON(d);
					this.data['constituency-card'] = {};
					this.data['GE2017-turnout'] = {};
					this.data['GE2017-results'] = {};
					for(var i = 0; i < data.length; i++){
						this.data['constituency-card'][data[i]['ccode1']] = JSON.parse(JSON.stringify(data[i]));
						this.data['GE2017-results'][data[i]['ccode1']] = data[i]['first17'];
						this.data['GE2017-turnout'][data[i]['ccode1']] = data[i]['turnout17'];
					}
					this.hex.data['GE2017-results'] = this.data['GE2017-results'];
					this.hex.data['GE2017-turnout'] = this.data['GE2017-turnout'];
					this.hex.data['constituency-card'] = this.data['constituency-card'];
					this.setColours(type);
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		}else if(type == "GE2019-candidates"){
			S().ajax('https://candidates.democracyclub.org.uk/media/candidates-parl.2019-12-12.csv',{
				'this': this,
				'dataType':'text',
				'success':function(d){
					var data = CSV2JSON(d);
					this.data['GE2019-candidates'] = {};
					for(var i = 0; i < data.length; i++){
						// We need a valid post_id to be set
						if(data[i].post_id && data[i].post_id.indexOf("WMC")>=0){
							pcd = data[i].post_id.replace(/^.*\:/,"");
							if(!this.data['GE2019-candidates'][pcd]) this.data['GE2019-candidates'][pcd] = [];
							this.data['GE2019-candidates'][pcd].push(JSON.parse(JSON.stringify(data[i])));
						}
					}
					this.hex.data['GE2019-candidates'] = this.data['GE2019-candidates'];
					this.setColours(type);
				},
				'error':function(e,attr){
					console.error('Unable to load '+attr.file );
				}
			});
		}else{
			S().ajax('../data/2015results.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data['GE2015-results'][c[0]] = c[1];
					}
					this.hex.data['GE2015-results'] = this.data['GE2015-results'];
					this.setColours("GE2015-results");
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		
		}
	}

	function getColour(pc,a,b){
		if(!b) b = a;
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}
	function makeGradient(a,b){
		if(!b) b = a;
		return 'background: '+a.hex+'; background: -moz-linear-gradient(left, '+a.hex+' 0%, '+b.hex+' 100%);background: -webkit-linear-gradient(left, '+a.hex+' 0%,'+b.hex+' 100%);background: linear-gradient(to right, '+a.hex+' 0%,'+b.hex+' 100%);';
	}

	this.setColours = function(type){
		if(!type) type = "region";

		S('#data-selector')[0].value = type;

		this.by = type;
		if(type == "GE2015-results" && (!this.data || !this.data["GE2015-results"])) return this.loadResults("GE2015-results");
		if(type == "GE2017-results" && (!this.data || !this.data["constituency-card"])) return this.loadResults("GE2017-results");
		if(type == "GE2017-turnout" && (!this.data || !this.data["constituency-card"])) return this.loadResults("GE2017-turnout");
		if(type == "referendum" && (!this.data || !this.data["referendum"])) return this.loadResults("referendum");
		if(type == "GE2017-candidates" && (!this.data || !this.data["GE2017-candidates"])) return this.loadResults("GE2017-candidates");
		if(type == "GE2019-candidates" && (!this.data || !this.data["GE2019-candidates"])) return this.loadResults("GE2019-candidates");
		if(type == "gender" && (!this.data || !this.data["gender"])) return this.loadResults("gender");
		if(type == "benefits" && (!this.data || !this.data["benefits"])) return this.loadResults("benefits");

		var key = "";
		var names = {'Con':'Conservative','Lab':'Labour','LD':'Lib Dem','PC':'Plaid Cymru','Ind':'Independent','Spk':'Speaker'};
		var p = {'Con':'#2254F4','Lab':'#D60303','LD':'#faa61a','SNP':'#fdf38e','PC':'#1DD3A7','UKIP':'#470A65','Green':'#0DBC37','DUP':'#4f4c9a','SDLP':'#fbb675','SF':'#b6c727','UUP':'#EF3AAB','Ind':'#dfdfdf','Spk':'#909090'};

		// Set the function for changing the colours
		if(type == "population"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var min = 25000;
			var max = 150000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].p - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+min+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+max;
		}else if(type == "electorate"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var mine = 50000;
			var maxe = 80000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].e - mine)/(maxe-mine);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+mine+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+maxe;
		}else if(type == "GE2015-results"){
			this.hex.setColours = function(region){
				r = this.data["GE2015-results"][region].replace(/[\n\r]/g,"");
				return (p[r] || '#000');
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}else if(type == "GE2017-results"){
			this.hex.setColours = function(region){
				r = this.data["GE2017-results"][region];
				if(r) r = r.replace(/[\n\r]/g,"");
				else console.warning('No region',r,region,p[r]);
				return (p[r] || '#000');
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}else if(type == "GE2017-turnout"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var mine = 40;
			var maxe = 80;
			this.hex.setColours = function(region){
				var value = (this.data["GE2017-turnout"][region] - mine)/(maxe-mine);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+mine+'%<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+maxe+'%';
		}else if(type == "referendum"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#2254F4');
			this.hex.setColours = function(region){
				return getColour(1 - (this.data["referendum"][region]-0.2)/0.6,a,b);
			}
			key = 'leave<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>remain';
		}else if(type == "benefits"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			this.hex.setColours = function(region){
				if(this.data["benefits"][region]) return getColour(Math.min(1,(this.data["benefits"][region])/10),a,b);
				else return '';
			}
			key = 'Percentage of constituency on income-based benefits (IS/JSA/ESA)<br />0%<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>10%+';
		}else if(type == "GE2017-candidates"){
			var levels = {0:'#2254F4',1:'#178CFF',2:'#00B6FF',3:'#08DEF9',4:'#1DD3A7',5:'#67E767',6:'#F9BC26'};
			this.hex.setColours = function(region){
				var n = this.data["GE2017-candidates"][region].length;
				var c = '#2254F4';
				if(n > 0) c = (levels[n] || levels[6]);
				return c;
			}
			key = '0';
			for(var n in levels){
				key += '<span style="background-color:'+levels[n]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>';
			}
			key += '&ge;6';
		}else if(type == "GE2019-candidates"){
			var levels = {0:'#2254F4',1:'#178CFF',2:'#00B6FF',3:'#08DEF9',4:'#1DD3A7',5:'#67E767',6:'#F9BC26'};
			this.hex.setColours = function(region){
				var n = 0;
				var c = '#2254F4';
				if(this.data["GE2019-candidates"][region]){
					n = this.data["GE2019-candidates"][region].length;
				}
				if(n > 0) c = (levels[n] || levels[6]);
				return c;
			}
			key = '0';
			for(var n in levels){
				key += '<span style="background-color:'+levels[n]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>';
			}
			key += '&ge;6';
		}else if(type == "gender"){
			var c = new Colour('#0DBC37');
			var b = new Colour('#F9BC26');
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
				return getColour(this.data["gender"][region].ratio,a,c);
			}
			key = 'The gender-split of candidates in each constituency<br />male<span style="'+makeGradient(c,a)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>female';

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


	function CSV2JSON(data,format,start,end){

		if(typeof start!=="number") start = 1;
		var delim = ",";

		if(typeof data==="string"){
			data = data.replace(/\r/,'');
			data = data.split(/[\n]/);
		}
		if(typeof end!=="number") end = data.length;

		if(data[0].indexOf("\t") > 0) delim = /\t/;
		var header = CSVtoArray(data[0]);
		var simpleheader = JSON.parse(JSON.stringify(header));
		var line,datum,key,key2,f,i;
		var newdata = new Array();
		var lookup = {};
		// Work out a simplified (no spaces, all lowercase) version of the 
		// keys for matching against column headings.
		if(format){
			for(i in format){
				key = i.replace(/ /g,"").toLowerCase();
				lookup[key] = i+'';
			}
			for(i = 0; i < simpleheader.length; i++) simpleheader[i] = simpleheader[i].replace(/ /g,"").toLowerCase();
		}
		for(i = start; i < end; i++){
			line = CSVtoArray(data[i]);
			datum = {};
			if(line){
				for(var j=0; j < line.length; j++){
					key = header[j];
					key2 = simpleheader[j];
					if(format && lookup[key2]){
						key = lookup[key2];
						f = format[key];
						if(format[key].name) key = format[key].name;
						if(f.format=="number"){
							if(line[j]!=""){
								if(line[j]=="infinity" || line[j]=="Inf") datum[key] = Number.POSITIVE_INFINITY;
								else datum[key] = parseFloat(line[j]);
							}
						}else if(f.format=="eval"){
							if(line[j]!="") datum[key] = eval(line[j]);
						}else if(f.format=="date"){
							if(line[j]){
								line[j] = line[j].replace(/^"/,"").replace(/"$/,"");
								try {
									datum[key] = new Date(line[j]);
								}catch(err){
									this.log.warning('Invalid date '+line[j]);
									datum[key] = new Date('0001-01-01');
								}
							}else datum[key] = null;
						}else if(f.format=="boolean"){
							if(line[j]=="1" || line[j]=="true" || line[j]=="Y") datum[key] = true;
							else if(line[j]=="0" || line[j]=="false" || line[j]=="N") datum[key] = false;
							else datum[key] = null;
						}else{
							datum[key] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
						}
					}else{
						datum[key] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];
					}
				}
				newdata.push(datum);
			}
		}
		return newdata;
	}
	// Return array of string values, or NULL if CSV string not well formed.
	function CSVtoArray(text) {
		var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
		var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
		// Return NULL if input string is not well formed CSV string.
		// Some strings fail the test
		//if (!re_valid.test(text)) return null;
		var a = [];					 // Initialize array to receive values.
		text.replace(re_value, // "Walk" the string using replace with callback.
			function(m0, m1, m2, m3) {
				// Remove backslash from \' in single quoted values.
				if	  (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
				// Remove backslash from \" in double quoted values.
				else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
				else if (m3 !== undefined) a.push(m3);
				return ''; // Return empty string.
			});
		// Handle special case of empty last value.
		if (/,\s*$/.test(text)) a.push('');
		return a;
	};
	
	return this;

}
