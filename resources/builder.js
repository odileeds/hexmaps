function HexBuilder(el,attr){

	this.name = "HexBuilder";
	this.version = "1.1";
	this.attr = attr;
	this.el = el;
	this.id = el.getAttribute('id');
	var side = 16;
	var width = attr.width||1088;
	var height = attr.height||1220;
	var padding = 2;
	this.query = {'labels':true,'borders':true,'keepmissing':true};
	this.options = {};
	this.options.el = this.el.querySelector('.options');
	this.options.el.style.display = 'none';

	this.colours = new Colours();
	var scales = {
		'Viridis8': 'rgb(122,76,139) 0%, rgb(124,109,168) 12.5%, rgb(115,138,177) 25%, rgb(107,164,178) 37.5%, rgb(104,188,170) 50%, rgb(133,211,146) 62.5%, rgb(189,229,97) 75%, rgb(254,240,65) 87.5%, rgb(254,240,65) 100%',
		'ODI': 'rgb(114,46,165) 0%, rgb(230,0,124) 50%, rgb(249,188,38) 100%',
		'Heat': 'rgb(0,0,0) 0%, rgb(128,0,0) 25%, rgb(255,128,0) 50%, rgb(255,255,128) 75%, rgb(255,255,255) 100%',
		'IMD-low-high': 'rgb(8,64,129) 0%, rgb(8,104,172) 10%, rgb(43,140,190) 20%, rgb(78,179,211) 30%, rgb(123,204,196) 40%, rgb(168,221,181) 50%, rgb(204,235,197) 60%, rgb(224,243,219) 70%, rgb(238,252,217) 80%, rgb(251,252,244) 90%, rgb(251,252,244) 100%',
		'IMD-high-low': 'rgb(251,252,244) 0%, rgb(238,252,217) 10%, rgb(224,243,219) 20%, rgb(204,235,197) 30%, rgb(168,221,181) 40%, rgb(123,204,196) 50%, rgb(78,179,211) 60%, rgb(43,140,190) 70%, rgb(8,104,172) 80%, rgb(8,64,129) 90%, rgb(8,64,129) 100%',
		'Planck': 'rgb(0,0,255) 0%, rgb(0,112,255) 16.666%, rgb(0,221,255) 33.3333%, rgb(255,237,217) 50%, rgb(255,180,0) 66.666%, rgb(255,75,0) 100%',
		'EPC': '#ef1c3a 1%, #ef1c3a 20.5%, #f78221 20.5%, #f78221 38.5%, #f9ac64 38.5%, #f9ac64 54.5%, #ffcc00 54.5%, #ffcc00 68.5%, #8cc63f 68.5%, #8cc63f 80.5%, #1bb35b 80.5%, #1bb35b 91.5%, #00855a 91.5%, #00855a 100%',
		'Plasma': 'rgb(12,7,134) 0%, rgb(82,1,163) 12.5%, rgb(137,8,165) 25%, rgb(184,50,137) 37.5%, rgb(218,90,104) 50%, rgb(243,135,72) 62.5%, rgb(253,187,43) 75%, rgb(239,248,33) 87.5%',
		'Referendum': '#4BACC6 0%, #B6DDE8 50%, #FFF380 50%, #FFFF00 100%',
		'Leodis': '#2254F4 0%, #F9BC26 50%, #ffffff 100%',
		'Longside': '#801638 0%, #addde6 100%',
		'Black': '#000000 0%, #000000 100%'
	};
	var str = '';
	for(var s in scales){
		this.colours.addScale(s,scales[s]);
		str += (str ? ', ':'')+'<code>'+s+'<span class="scale-preview" style="'+this.colours.getGradient(s)+';"></span></code>';
	}
	var snel = document.getElementById('scale-names');
	if(snel) snel.innerHTML = str;
	this.colourscale = 'Viridis8';

	this.createMap = function(){

		// Get full range of r and q
		var range = {'r':{'min':Infinity,'max':-Infinity},'q':{'min':Infinity,'max':-Infinity}};
		for(var h in this.data.hexes){
			range.r.min = Math.min(this.data.hexes[h].r,range.r.min);
			range.q.min = Math.min(this.data.hexes[h].q,range.q.min);
			range.r.max = Math.max(this.data.hexes[h].r,range.r.max);
			range.q.max = Math.max(this.data.hexes[h].q,range.q.max);
		}
		
		var dim = Math.max(range.r.max-range.r.min, range.q.max-range.q.min);

		var hxel = this.el.querySelector('.hexmap');

		// Set the ID for the map
		hxel.setAttribute('id',this.id+'-hexmap');

		width = Math.min(this.el.querySelector('.hexmap').clientWidth,attr.width||1088);
		height = width*(range.r.max-range.r.min)/dim;

		side = width/((dim+3)*1.73205);	

		var _obj = this;

		if(!this.hex){
			this.hex = new OI.hexmap(document.getElementById(this.id+'-hexmap'),{
				'id':this.id+'-hexmap',
				'width':width,
				'height':height,
				'size':side,
				'padding':padding,
				'minFontSize': 0,
				'grid': { 'show': true },
				'label': { 'show': this.query.labels },
				'style': {
					'selected':{'fill-opacity':1, 'fill':'' },
					'default':{'fill-opacity':1,'fill':'#722EA5','font-size':side/4},
					'grid':{'fill-opacity':0.1,'fill':'#ccc'}
				},
				'formatLabel': function(txt,attr){
					if(!txt) txt = "";
					return txt.replace(/\s/g,"\n").replace(/\//g,"\/\n");
				}
			});

			// Add key press functionality
			document.addEventListener('keypress',function(e){
				e.stopPropagation();
				if(e.key=="c") _obj.selectBySameColour(e);
			});

			this.selectBySameColour = function(){
				if(this.hex.selected){
					for(var region in this.hex.areas){
						if(this.hex.areas[region].fillcolour==this.hex.areas[this.hex.selected].fillcolour){
							this.hex.areas[region].selected = true;
							this.hex.setHexStyle(region);
						}
					}
				}
				return this;
			};
			this.deselectAll = function(){
				if(this.hex.selected){
					for(var region in this.hex.areas){
						this.hex.areas[region].selected = false;
						this.hex.setHexStyle(region);
					}
				}
				return this;				
			};

			this.changeSelectedColour = function(to){
				for(var region in this.hex.areas){
					if(this.hex.areas[region].selected){
						this.hex.areas[region].fillcolour = to;
						this.hex.mapping.hexes[region].colour = to;
						//this.hex.areas[region].selected = false;
						this.hex.setHexStyle(region);
					}
				}
				return this;
			};
			function isOdd(v){ return Math.abs(v)%2==1; }
			function isEven(v){ return Math.abs(v)%2==0; }
			this.shiftHex = function(region,shift){
				var dq,dr,layout,hex;
				
				hex = this.hex.mapping.hexes[region];
				layout = this.hex.mapping.layout;

				dq = shift.b.q - shift.a.q;
				dr = shift.b.r - shift.a.r;
				
				if(layout == "odd-r"){
					// If the original hex is shifting from an even row to an odd row then:
					//   - if the current hex is on an even row it has the same dq
					//   - if the current hex is on an odd row it increases dq by 1
					if(isEven(shift.a.r) && isOdd(shift.b.r) && isOdd(hex.r)) dq++;
					// If the original hex is shifting from an odd row to an even row then:
					//   - if the current hex is on an even row we need to decrease dq by 1
					//   - if the current hex is on an odd row it has the same dq
					if(isOdd(shift.a.r) && isEven(shift.b.r) && isEven(hex.r)) dq--;
				}else if(layout == "even-r"){
					// If the original hex is shifting from an even row to an odd row then:
					//   - if the current hex is on an even row it has the same dq
					//   - if the current hex is on an odd row it decreases dq by 1
					if(isEven(shift.a.r) && isOdd(shift.b.r) && isOdd(hex.r)) dq--;
					// If the original hex is shifting from an odd row to an even row then:
					//   - if the current hex is on an even row we need to increase dq by 1
					//   - if the current hex is on an odd row it has the same dq
					if(isOdd(shift.a.r) && isEven(shift.b.r) && isEven(hex.r)) dq++;
				}else if(layout == "odd-q"){
					// If the original hex is shifting from an even column to an odd column then:
					//   - if the current hex is on an even column it has the same row shift
					//   - if the current hex is on an odd column it increases dr by 1
					if(isEven(shift.a.q) && isOdd(shift.b.q) && isOdd(hex.r)) dr++;
					// If the original hex is shifting from an odd column to an even column then:
					//   - if the current hex is on an even column we need to decrease dr by 1
					//   - if the current hex is on an odd column it has the same dr
					if(isOdd(shift.a.q) && isEven(shift.b.q) && isEven(hex.q)) dr--;
				}else if(layout == "even-q"){
					// If the original hex is shifting from an even column to an odd column then:
					//   - if the current hex is on an even column it has the same row shift
					//   - if the current hex is on an odd column it needs to decrease dr by 1
					if(isEven(shift.a.q) && isOdd(shift.b.q) && isOdd(hex.r)) dr--;
					// If the original hex is shifting from an odd column to an even column then:
					//   - if the current hex is on an even column we neeed to inccrease dr by 1
					//   - if the current hex is on an odd column it has the same dr
					if(isOdd(shift.a.q) && isEven(shift.b.q) && isEven(hex.q)) dr++;
				}

				return {'q':this.hex.mapping.hexes[region].q+dq, 'r': this.hex.mapping.hexes[region].r+dr};
			}

			// Move the selected hex to the new coordinates
			this.moveTo = function(q,r){
				var shift,pos,region,h;
				if(this.hex.selected){
					shift = {'a':{'q':this.hex.mapping.hexes[this.hex.selected].q,'r':this.hex.mapping.hexes[this.hex.selected].r},'b':{'q':q,'r':r}};
					for(region in this.hex.areas){
						if(this.hex.areas[region]){
							if(region.indexOf(this.hex.selected)==0) this.hex.areas[region].selected = true;
							if(this.hex.areas[region].selected){
								pos = this.shiftHex(region,shift);
								this.hex.mapping.hexes[region].q = pos.q;
								this.hex.mapping.hexes[region].r = pos.r;
								var h = this.hex.drawHex(this.hex.mapping.hexes[region].q,this.hex.mapping.hexes[region].r);
								this.hex.areas[region].hex.setAttribute('d',h.path);
								this.hex.areas[region].array = h.array;
								if(this.hex.options.showlabel && this.hex.areas[region].label){
									this.hex.areas[region].label.setAttribute('x',h.x);
									this.hex.areas[region].label.setAttribute('y',h.y);
									this.hex.areas[region].label.setAttribute('clip-path','hex-clip-'+this.hex.mapping.hexes[region].q+'-'+this.hex.mapping.hexes[region].r);
								}
								this.hex.areas[region].selected = false;
								this.hex.setHexStyle(region);
							}
						}
					}
					this.hex.selected = "";
				}
			};


			// Make a tooltip
			var tip;

			this.hex.on('mouseover',{'builder':this},function(e){
				if(e.data.type=="hex"){
					e.data.hexmap.regionFocus(e.data.region);

					// Build tooltip
					var svg,bb,bbo,hex;
					svg = e.data.hexmap.el;
					hex = e.target;
					if(!tip || !tip.parentNode){
						// Add a new tooltip
						tip = document.createElement('div');
						tip.classList.add('tooltip');
						svg.appendChild(tip);
					}
					// Update contents of tooltip
					tip.innerHTML = e.data.builder.getLabel(e.data.data,true);

					// Update position of tooltip
					bb = hex.getBoundingClientRect();
					bbo = svg.getBoundingClientRect();
					tip.style.left = Math.round(bb.left + bb.width/2 - bbo.left + svg.scrollLeft)+'px';
					tip.style.top = Math.round(bb.top + bb.height/2 - bbo.top)+'px';			

				}else if(e.data.type=="grid"){
					var selected = e.data.hexmap.selected;
					if(e.data.hexmap.selected){
						e.target.setAttribute('fill-opacity',0.5);
						
						var region,cells,c,cell;
						var q = e.data.data.q;
						var r = e.data.data.r;
						var hexes = e.data.hexmap;
						var shift = {'a':{'q':hexes.mapping.hexes[selected].q,'r':hexes.mapping.hexes[selected].r},'b':{'q':q,'r':r}};

						// Reset grid
						cells = e.data.hexmap.grid.querySelectorAll('.hex-grid');
						for(c = 0; c < cells.length; c++) cells[c].setAttribute('fill-opacity',0.1);

						// Set the opacity for every grid cell that will have a selected hex placed on it
						for(region in hexes.areas){
							if(hexes.areas[region] && hexes.areas[region].selected){
								pos = e.data.builder.shiftHex(region,shift);
								cell = e.data.hexmap.grid.querySelector('.hex-grid[data-q="'+(pos.q||"0")+'"][data-r="'+(pos.r||"0")+'"]');
								if(cell) cell.setAttribute('fill-opacity',0.5);
								else e.data.builder.log('warn','No cell for ',pos);
							}
						}
					}
				}
			}).on('mouseout',function(e){
				if(e.data.type=="hex"){
					removeEl(tip);
					e.data.hexmap.regionBlur(e.data.region);
				}else if(e.data.type=="grid"){
					if(e.data.hexmap.selected) e.target.setAttribute('fill-opacity',0.1);
					// Reset grid
					cells = e.data.hexmap.grid.querySelectorAll('.hex-grid');
					for(c = 0; c < cells.length; c++) cells[c].setAttribute('fill-opacity',0.1);
				}
			}).on('click',{'builder':this},function(e){
				if(e.data.type=="hex"){
					if(_obj.search && _obj.search.active) _obj.search.toggle();
					e.data.hexmap.regionToggleSelected(e.data.region,true);
				}else if(e.data.type=="grid"){
					if(e.data.hexmap.selected){
						_obj.moveTo(e.data.data.q,e.data.data.r);
						e.target.setAttribute('fill-opacity',0.1);
					}
				}
			});

			// Build menu
			this.menu = new Menu(this);

			this.colourpicker = new ColourPicker();
			this.colourpicker.addTo(this.menu);

			this.infobubble = new InfoBubble();
			this.infobubble.addTo(this.menu);

			// Add hexmap search
			this.search = new OI.hexmapsearch(this.hex);
		}

		return this;
	};

	this.getLabel = function(data,short){
		var l,a,d;
		d = clone(data);
		if(typeof d==="string") l = d;
		else{
			l = (d.title||d.name||d.n);
			if(typeof l==="undefined" && d[this.typ.name]) l = d[this.typ.name];
			if(typeof l==="undefined") l = "";
			if(!short){
				if(typeof d.r==="number" && typeof d.q==="number"){
					if(l) l = '<strong>'+l+'</strong><br />';
					l += 'r,q: <strong>'+d.r+','+d.q+'</strong>';
					delete d.r;
					delete d.q;
				}
				for(a in d) l += (l ? '<br />':'')+a+': <strong>'+d[a]+'</strong>';
			}
		}
		return l;
	};

	this.saveable = (typeof Blob==="function");

	var _obj = this;
	var dropZone;
	function dropOver(evt){
		evt.stopPropagation();
		evt.preventDefault();
		dropZone.classList.add('drop');
	}
	function dragOff(){ dropZone.classList.remove('drop'); }
	function submitForm(e){
		if(e){
			e.preventDefault();
			e.stopPropagation();
		}
		var url = "";
		var el = document.getElementById('url');
		if(el) url = el.value;
		if(_obj.file) _obj.process();
		else if(!_obj.file && url) _obj.getFromURL(url,_obj.process);
		else _obj.message('No data provided. Please make sure you either provide a URL or file.',{'id':'error','type':'ERROR'});
		return false;
	}
	this.init = function(){
		var kv,str,bits,b,file,fm;

		fm = document.getElementById('validation_form');
		fm.addEventListener('reset',function(e){
			e.preventDefault();
			_obj.reset();
		});
		fm.addEventListener('submit',submitForm);
		document.getElementById('example').addEventListener('click',function(e){
			e.preventDefault();
			_obj.example();
		});


		// Setup the dnd listeners.
		dropZone = document.getElementById('drop_zone');
		dropZone.addEventListener('dragover', dropOver, false);
		dropZone.addEventListener('dragout', dragOff, false);
		document.getElementById('standard_files').addEventListener('change',function(e){ _obj.handleFileSelect(e); });

		// Get parts of the query string
		str = location.search.substr(1);
		bits = str.split(/\&/);
		for(b = 0; b < bits.length; b++){
			if(bits[b].indexOf('http')==0 || bits[b].indexOf("=") == -1){
				this.query.url = bits[b];
			}else{
				kv = bits[b].split(/=/);
				kv[1] = decodeURI(kv[1]);
				if(kv[1]=="true") kv[1] = true;
				if(kv[1]=="false") kv[1] = false;
				this.query[kv[0]] = kv[1];
			}
		}
		if(!this.query.url && this.query.gsheetid) this.query.url = "https://docs.google.com/spreadsheets/d/"+this.query.gsheetid+"/gviz/tq?tqx=out:csv";
		if(this.query.colourscale && scales[this.query.colourscale]) this.colourscale = this.query.colourscale;

		file = this.query.url;
		if(file){
			document.getElementById('url').value = file;
			submitForm();
		}

		return this;
	};
	function removeEl(el){
		if(el && el.parentNode !== null) el.parentNode.removeChild(el);
	}
	this.reset = function(){
		document.getElementById('drop_zone').classList.remove('loaded');
		document.getElementById('url').value = "";
		document.querySelector('#drop_zone .helpertext').style.display = '';
		if(document.getElementById('results')) document.getElementById('results').style.display = '';
		document.getElementById('standard_files').value = "";

		this.hex.el.remove();

		this.options.el.innerHTML = "";
		if(this.scalebar) this.scalebar.remove();

		delete this.options.config;
		delete this.options.attrib;
		delete this.options.scale;
		delete this.options.border;

		removeEl(document.getElementById('filedetails'));
		document.getElementById('messages').innerHTML = '';
		var tr = document.querySelectorAll('table.odi tr');
		if(tr.length > 1){
			for(var i = 1; i < tr.length; i++) removeEl(tr[i]);
		}
		document.querySelector('.part').classList.remove('c8-bg');
		document.querySelector('.part').classList.add('c5-bg');

		this.message('',{'id':'process'});

		delete this.hex;
		delete this.data;
		delete this.url;
		delete this.file;
		delete this.colourpicker;
		delete this.scalebar;
		delete this.search;

		return this;
	};
	
	this.example = function(){
		var el = document.getElementById('url');
		el.value = el.getAttribute('placeholder').replace(/^.*(https?:\/\/[^\s]+).*$/,function(m,p1){ return p1; });
		this.getFromURL(el.value,this.process);
		return this;
	};

	this.process = function(){

		if(!this.file.type){
			if(this.file.name.indexOf(".csv")>=0) this.file.type = "csv";
			if(this.file.name.indexOf(".hexjson")>=0) this.file.type = "hexjson";
		}
		if(!this.file.type){
			if(this.file.contents.indexOf(/"hexjson"/) > 0){
				this.file.type = "hexjson";
			}else{
				this.file.type = "csv";
			}
		}
		
		if(this.file.type == "csv"){

			var i,j,t,gss,r,q,id,code,got,m;
			var data = this.parseCSV(this.file.contents,{'url':this.file.name});
			this.file.csv = data;
			this.data = { 'layout': 'odd-r', 'hexes': {} };
			id = -1;
			// https://en.wikipedia.org/wiki/ONS_coding_system
			gss = {
				'PCON':{
					'title':'Parliamentary Constituencies (2019)',
					'patterns':[/^E14[0-9]{6}$/,/^W07[0-9]{6}$/,/^S14[0-9]{6}$/,/^N06[0-9]{6}$/],
					'hexjson':'https://raw.githubusercontent.com/odileeds/hexmaps/gh-pages/maps/constituencies.hexjson'
				},
				'LAD':{
					'title': 'Local Authority Districts (2021)',
					'patterns':[/^E06[0-9]{6}$/,/^W06[0-9]{6}$/,/^S12[0-9]{6}$/,/^E07[0-9]{6}$/,/^E08[0-9]{6}$/,/^E09[0-9]{6}$/],
					'hexjson': 'https://raw.githubusercontent.com/odileeds/hexmaps/gh-pages/maps/uk-local-authority-districts-2021.hexjson'
				},
				'NUTS3':{
					'title': 'NUTS3 regions',
					'patterns':[/^UK[C-N][0-9]{2}$/],
					'hexjson': 'https://raw.githubusercontent.com/odileeds/hexmaps/gh-pages/maps/uk-nuts3.hexjson'
				},
				'UTLA':{
					'title': 'Upper Tier Local Authorities',
					'hexjson': 'https://raw.githubusercontent.com/odileeds/hexmaps/gh-pages/maps/uk-upper-tier-local-authorities.hexjson'
				},
				'Senedd':{
					'title': 'Senedd Constituencies',
					'patterns':[/^W09[0-9]{6}$/],
					'hexjson': 'https://raw.githubusercontent.com/odileeds/hexmaps/gh-pages/maps/wales-senedd-constituencies.hexjson'
				},
				'MSOA':{
					'title': 'MSOAs',
					'patterns':[/^[EWS]02[0-9]{6}$/],
					'hexjson': 'https://raw.githubusercontent.com/houseofcommonslibrary/uk-hex-cartograms-noncontiguous/main/hexjson/msoa_hex_coords.hexjson'
				},
				'ICB':{
					'title': 'NHS Integrated Care Boards',
					'patterns':[/^Q[A-Z0-9]{2}$/],
					'hexjson': 'maps/nhs-icb-2022.hexjson'
				},
				'PCN':{
					'title': 'NHS Primary Care Networks',
					'patterns':[/^U[0-9]{5}$/],
					'hexjson': 'maps/nhs-pcn-2022.hexjson'					
				},
				'US-States':{
					'title': 'US States',
					'patterns':[/^(AL|AK|AZ|AR|CA|CO|CT|DC|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/],
					'hexjson': 'maps/us-states.hexjson'
				}
			};
			r = -1;
			q = -1;
			for(code in gss){
				gss[code].count = 0;
				gss[code].matches = {};
			}
			if(data.fields && data.fields.name){
				for(j = 0; j < data.fields.name.length; j++){
					if(data.fields.name[j].toLowerCase()=="id") id = j;
					if(data.fields.name[j].toLowerCase()=="gss-code") id = j;
					if(data.fields.name[j].toLowerCase()=="code") id = j;
					if(data.fields.name[j].toLowerCase()=="r") r = j;
					if(data.fields.name[j].toLowerCase()=="q") q = j;
				}
			}
			if(r < 0 && q < 0){
				this.message('No coordinates given.',{'id':'process','type':'WARNING'});
				for(j = 0; j < data.rows.length; j++){
					got = false;
					for(code in gss){
						if(gss[code].patterns){
							for(k = 0; k < data.rows[j].length; k++){
								if(typeof data.rows[j][k]==="string"){
									for(m = 0; m < gss[code].patterns.length; m++){
										if(data.rows[j][k].match(gss[code].patterns[m])){
											got = true;
											gss[code].matches[data.rows[j][k]] = true;
											gss[code].id = k;
										}
									}
								}
							}
							if(got){
								gss[code].count++;
							}
						}
					}
				}
				var typ = {'id':'','count':0};
				for(t in gss){
					n = Object.keys(gss[t].matches).length;
					if(n > typ.count) typ = {'id':t,'count':n};
				}
				if(id < 0 && typeof gss[typ.id].id==="number") id = gss[typ.id].id;
				if(id >= 0) typ.name = data.fields.name[id];
				this.typ = typ;
				if(typ.id){
					if(gss[typ.id].hexjson){
						this.message('Loading '+gss[typ.id].title+' hexes from '+gss[typ.id].hexjson,{'id':'process','type':'WARNING'});
						OI.ajax(gss[typ.id].hexjson,{
							'dataType': 'json',
							'this':this,
							'data': data,
							'id': id,
							'success':function(result,attr){
								this.message('Loaded '+gss[typ.id].title+' hexes from '+attr.url,{'id':'process','class':'c5-bg'});
								// Loop over HexJSON adding in data
								this.data = result;
								var r,nm,ok;
								for(r = 0; r < attr.data.data.rows.length; r++){
									id = attr.data.data.rows[r][attr.data.id];
									if(id){
										if(this.data.hexes[id]){
											for(j = 0; j < attr.data.data.fields.name.length; j++){
												nm = attr.data.data.fields.name[j];
												if(nm && !this.data.hexes[id][nm]) this.data.hexes[id][nm] = attr.data.data.rows[r][j];
											}
										}else{
											console.warn(id+' does not seem to exist in HexJSON',this.data.hexes);
											delete this.data.hexes[id];
										}
									}else{
										console.warn('Missing ID on line '+r);
									}
								}
								if(this.file.type=="csv" && !this.query.keepmissing){
									// Limit the hexes to those with data
									var removed = 0;
									for(id in this.data.hexes){
										ok = false;
										for(r = 0; r < attr.data.data.rows.length; r++){
											if(id==attr.data.data.rows[r][attr.data.id]) ok = true;
										}
										if(!ok){
											delete this.data.hexes[id];
											removed++;
										}
									}
									if(removed) this.message('Removed '+removed+' hexes with no data in '+this.file.name+'.',{'id':'removed','class':'c14-bg'});
								}
								this.processed();
							},
							'error': function(e,attr){
								this.message('Unable to load '+attr.url,{'id':'load','type':'ERROR'});
							}
						});
					}else{
						this.message('No HexJSON to load for '+t,{'id':'process','type':'WARNING'});
					}
				}else{
					this.message('Unable to guess a known geography.',{'id':'process','type':'WARNING'});
				}
			}else{
				// Create a HexJSON format
				for(i = 0; i < data.rows.length; i++){
					// Set a default in case it doesn't exist
					this.data.hexes[data.rows[i][id]] = { "n": data.rows[i][id] };
					// Set the properties of the hex
					for(j = 0; j < data.rows[i].length; j++){
						if(data.fields.format[j]=="integer") data.rows[i][j] = parseInt(data.rows[i][j]);
						if(data.fields.format[j]=="float") data.rows[i][j] = parseFloat(data.rows[i][j]);
						if(data.fields.format[j]=="boolean") data.rows[i][j] = (data.rows[i][j].toLowerCase()=="true" ? true : false);
						this.data.hexes[data.rows[i][0]][data.fields.name[j]] = data.rows[i][j];
						if(data.fields.name[j].toLowerCase() == "name") this.data.hexes[data.rows[i][0]].n = data.rows[i][j];
					}
				}
				return this.processed();
			}

		}else if(this.file.type == "hexjson"){

			if(typeof this.file.contents==="string") this.data = JSON.parse(this.file.contents);
			else this.data = this.file.contents;
			this.typ = {'id':'','count':0};
			return this.processed();
		}
		return this;
	};

	this.processed = function(){
		var got,len,region,s,q,r,key,div,lbl,sel,opt,cssel,save,savesvg,savepng,savegeo;
		got = {};
		len = 0;
		this.numeric = {};
		// Find out which q,r combinations we have
		for(region in this.data.hexes){
			q = this.data.hexes[region].q;
			r = this.data.hexes[region].r;
			if(typeof q==="number" && typeof r==="number"){
				if(!got[q]) got[q] = {};
				got[q][r] = true;
			}
			len++;
		}
		s = Math.ceil(Math.sqrt(len)) + padding*2;
		// Do we need to create dummy q, r values?
		q = 0;
		r = 0;
		for(region in this.data.hexes){
			if(typeof this.data.hexes[region].q!=="number" && typeof this.data.hexes[region].r!=="number"){
				while(got[q] && got[q][r]){
					q++;
					if(q > s){
						q = 0;
						r+=2;
					}
				}
				if(!got[q]) got[q] = {};
				got[q][r] = true;
				this.data.hexes[region].q = q;
				this.data.hexes[region].r = r;
			}
			for(key in this.data.hexes[region]){
				if(typeof this.data.hexes[region][key]==="number") this.numeric[key] = {'type':'number'};
				if(typeof this.data.hexes[region][key]==="string"){
					if(!isNaN(Date.parse(this.data.hexes[region][key]))) this.numeric[key] = {'type':'date'};
					if(this.data.hexes[region][key].match(/^#[0-9A-Z]{6}$/i)) this.numeric[key] = {'type':'colour'};
				}
			}
		}

		// Create a dropdown for colouring the hexes
		if(!this.options.config){
			div = document.createElement('div');
			div.classList.add('config');
			this.options.config = div;
			this.options.el.appendChild(div);
			
			row = document.createElement('div');
			row.classList.add('row');

			lbl = document.createElement('label');
			lbl.innerHTML = 'Select data attribute/column to colour hexes by';
			lbl.setAttribute('for','data-attribute');
			row.appendChild(lbl);
			sel = document.createElement('select');
			sel.setAttribute('id','data-attribute');
			sel.innerHTML = '<option>Attributes</option>';
			for(key in this.numeric){
				opt = document.createElement('option');
				opt.innerHTML = key;
				opt.setAttribute('value',key);
				if(this.query.attribute && key == this.query.attribute) opt.setAttribute('selected','selected');
				sel.appendChild(opt);
			}
			sel.addEventListener('change',function(e){ _obj.setColours(e.target.value); });
			row.appendChild(sel);
			
			this.options.attrib = sel;
			this.options.config.appendChild(row);
		}

		if(!this.options.scale){
			row = document.createElement('div');
			row.classList.add('row');

			lbl = document.createElement('label');
			lbl.innerHTML = 'Select colour scale';
			lbl.setAttribute('for','data-colourscale');
			row.appendChild(lbl);
			cssel = document.createElement('select');
			cssel.setAttribute('id','data-colourscale');
			for(s in scales){
				opt = document.createElement('option');
				opt.innerHTML = s;
				opt.setAttribute('value',s);
				if(this.colourscale == s) opt.setAttribute('selected','selected');
				cssel.appendChild(opt);
			}
			cssel.addEventListener('change',function(e){
				_obj.colourscale = e.target.value;
				_obj.setColours(sel.value);
			});
			row.appendChild(cssel);
			this.options.config.appendChild(row);
			this.options.scale = cssel;
		}
		
		if(!this.options.border){
			
			row = document.createElement('div');
			row.classList.add('row');

			lbl = document.createElement('label');
			lbl.innerHTML = 'Hex borders?';
			lbl.setAttribute('for','data-border');
			row.appendChild(lbl);
			brdel = document.createElement('input');
			brdel.setAttribute('id','data-border');
			brdel.setAttribute('type','checkbox');
			if(this.query.borders) brdel.setAttribute('checked','checked');
			brdel.addEventListener('change',function(e){ _obj.setBorders(); });
			row.appendChild(brdel);
			this.options.border = brdel;
			
			row.appendChild(brdel);
			this.options.config.appendChild(row);
		}


		this.options.el.style.display = '';

		// Create the map
		this.createMap();

		this.hex.addHexes(this.data,{me:this},function(e){ e.data.me.setColours("region"); });

		var opt = document.querySelector('#'+this.id+' .options');
		opt.classList.add("holder");
		opt.style['text-align'] = 'center';
		
		// If we can save then we build the save buttons and add events to them
		if(this.saveable){
			var _obj = this;
			div = document.createElement('div');
			div.classList.add('save');
			div.innerHTML = '<h3>Save cartogram</h3><div id="save-primary" style="font-size:1.4em;"></div><p style="color:#999;">Only the HexJSON format can be reloaded in this tool for further editing.</p><p id="link"></p>';
			this.options.el.appendChild(div);

			save = document.createElement('button');
			save.classList.add('c10-bg');
			save.innerHTML = 'HexJSON';
			save.addEventListener('click',function(){ _obj.save(); });
			div.querySelector('#save-primary').appendChild(save);

			savesvg = document.createElement('button');
			savesvg.classList.add('c8-bg');
			savesvg.innerHTML = 'SVG';
			savesvg.addEventListener('click',function(){ _obj.saveSVG(); });
			div.querySelector('#save-primary').appendChild(savesvg);

			savegeo = document.createElement('button');
			savegeo.classList.add('c8-bg');
			savegeo.innerHTML = 'GeoJSON';
			savegeo.addEventListener('click',function(){ _obj.saveGeoJSON(); });
			div.querySelector('#save-primary').appendChild(savegeo);
			
			savepng = document.createElement('button');
			savepng.classList.add('c8-bg');
			savepng.innerHTML = 'PNG';
			savepng.addEventListener('click',function(){
				var svg = _obj.hex.el.querySelector('.hexmap-map');
				var grid = svg.querySelectorAll('.hex-grid');
				// Hide all the grid cells
				for(var g = 0; g < grid.length; g++) grid[g].style.display = 'none';
				SVG2PNG(svg,{
					'src':'hexmap.png',
					'callback':function(src){
						// Show all the grid cells
						for(var g = 0; g < grid.length; g++) grid[g].style.display = '';
					}
				});
			});
			div.querySelector('#save-primary').appendChild(savepng);

		}

		// Set the chosen attribute if one has been provided in the query string
		this.setColours(this.query.attribute);
		
		this.setLabelState();
		
		this.setBorders();

		return this.updateLink();
	};
	this.toggleBorders = function(){
		this.options.border.checked = !this.options.border.checked;
		this.setBorders();
		return this;
	};
	this.setBorders = function(){
		var cells = document.querySelectorAll('.hex-cell');
		for(var c = 0; c < cells.length; c++) cells[c].style['stroke-width'] = (this.options.border.checked) ? '' : '0px';
		return this.updateLink();
	};
	this.setLabelState = function(){
		var labels = document.querySelectorAll('.hex-label');
		var label = this.query.labels ? '':'none';
		for(var l = 0; l < labels.length; l++) labels[l].style.display = label;
		return this.updateLink();
	};
	this.toggleLabels = function(){
		this.query.labels = !this.query.labels;
		return this.setLabelState();
	};
	
	this.parseCSV = function(data,attr){

		this.csv = data;

		if(attr.cols*this.maxrows > this.maxcells){
			// We have lots of columns meaning that we have more cells that we're allowing
			// so limit the number of rows
			this.maxrows = Math.floor(this.maxcells/attr.cols);
		}
		this.records = attr.rows; 

		// Convert the CSV to a JSON structure
		return CSV2JSON(data);

	};

	this.getFromURL = function(url,callback){
		this.url = url;
		OI.ajax(url,{
			'dataType': (url.indexOf('\.hexjson') > 0 ? 'json':'text'),
			'this':this,
			'callback': callback,
			'success':function(result,attr){
				this.message('Loaded data from '+attr.url+(attr.url.indexOf('odileeds') < 0 && attr.url.indexOf('open-innovations') < 0 ? ' ⚠️ data from an external source' : ''),{'id':'load','class':'c5-bg','type':'info'});
				this.file = { 'name': attr.url, 'contents': result };
				if(typeof attr.data.callback==="function") attr.data.callback.call(this);
			},
			'error': function(e,attr){
				this.message('Unable to load '+attr.url,{'id':'load','type':'ERROR'});
			}
		});
		return this;
	};

	this.handleFileSelect = function(evt){

		evt.stopPropagation();
		evt.preventDefault();
		dragOff();

		var files;
		if(evt.dataTransfer && evt.dataTransfer.files) files = evt.dataTransfer.files; // FileList object.
		if(!files && evt.target && evt.target.files) files = evt.target.files;

		var _obj = this;

		// files is a FileList of File objects. List some properties.
		var output = "";
		var result;
		var f = files[0];
		this.file = {'name':f.name};

		// Work out what the file type is
		var typ = "";
		if(f.name.indexOf(".csv")>=0) typ = "csv";
		if(f.name.indexOf(".hexjson")>=0) typ = "hexjson";

		
		if(typ == "hexjson" || typ == "csv"){

			this.file.type = typ;

			output += '<div id="filedetails">'+ (f.name)+ ' - ' + niceSize(f.size) + '</div>';

			var start = 0;
			var stop = f.size - 1; //Math.min(100000, f.size - 1);

			var reader = new FileReader();

			// Closure to capture the file information.
			reader.onloadend = function(evt) {
				if (evt.target.readyState == FileReader.DONE) { // DONE == 2
					if(stop > f.size - 1){
						var l = evt.target.result.regexLastIndexOf(/[\n\r]/);
						result = (l > 0) ? evt.target.result.slice(0,l) : evt.target.result;
					}else result = evt.target.result;
					_obj.file.contents = result;
				}
			};
			
			// Read in the image file as a data URL.
			//reader.readAsText(f);
			var blob = f.slice(start,stop+1);
			reader.readAsText(blob);
			dropZone.classList.add('loaded');
			appendHTML(output,dropZone);

		}else{
			this.message('Unable to load '+this.file,{'id':'error','type':'ERROR'});
		}

		return this;
	};
	
	function appendHTML(html,el){
		var d = document.createElement('template');
		d.innerHTML = html;
		var c = (typeof d.content==="undefined" ? d : d.content);
		if(c.childNodes.length > 0) while(c.childNodes.length > 0) el.appendChild(c.childNodes[0]);
	}


	this.saveSVG = function(){

		// Make hex json
		var str = this.hex.el.querySelector('.hexmap-map').outerHTML;
		this.save(str,"map.svg",'text/application/svg+xml');

		return this;
	};
	function roundTo(v,dp){
		if(!dp) dp = 5;
		var s = Math.pow(10,dp);
		return Math.round(v*s)/s;
	}
	// Construct a fake GeoJSON. It is "fake" in the sense that we will place the map at Null Island and scale the map to a 0.1x0.1 degree grid to try to keep it fairly Car.
	this.saveGeoJSON = function(){
		var h,x,y,bit,j,p;
		var scale = 1/(Math.max(this.hex.maxw,this.hex.maxh)*10);
		var geojson = {"type":"FeatureCollection","features":[]};
		var feature;
		for(h in this.hex.areas){
			x = 0;
			y = 0;
			feature = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[]]},"properties":clone(this.hex.mapping.hexes[h]||{})};
			feature.properties.id = h;
			p = this.hex.areas[h].orig.array;
			for(bit = 0; bit < p.length; bit++){
				if(p[bit][0] == "M"){
					x = p[bit][1][0];
					y = p[bit][1][1];
				}else if(p[bit][0] == "m"){
					x += p[bit][1][0];
					y += p[bit][1][1];
					feature.geometry.coordinates[0].push([roundTo(x*scale),roundTo(-y*scale)]);
				}else if(p[bit][0] == "l"){
					for(j = 0; j < p[bit][1].length; j += 2){
						x += (p[bit][1][j]);
						y += (p[bit][1][j+1]);
						feature.geometry.coordinates[0].push([roundTo(x*scale),roundTo(-y*scale)]);
					}
				}else if(p[bit][0] == "z"){
					feature.geometry.coordinates[0].push(feature.geometry.coordinates[0][0]);
				}
			}
			geojson.features.push(feature);
		}
		this.save(JSON.stringify(geojson),"map.geojson","application/geo+json");
		return this;
	};

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
	};


	function Log(opt){
		// Console logging version 2.0
		if(!opt) opt = {};
		if(!opt.title) opt.title = "Log";
		if(!opt.version) opt.version = "2.0";
		this.message = function(...args){
			var t = args.shift();
			if(typeof t!=="string") t = "log";
			var ext = ['%c'+opt.title+' '+opt.version+'%c'];
			if(args.length > 0){
				ext[0] += ':';
				if(typeof args[0]==="string") ext[0] += ' '+args.shift();
			}
			ext.push('font-weight:bold;');
			ext.push('');
			if(args.length > 0) ext = ext.concat(args);
			console[t].apply(null,ext);
		};
		return this;
	}

	var log = new Log({"title":this.name,"version":this.version});
	this.log = log.message;
	
	this.message = function(msg,attr){
		if(!attr) attr = {};
		if(!attr.id) attr.id = 'default';
		if(!attr.type) attr.type = 'log';
		var css = "b5-bg";
		if(attr.type=="ERROR"){ css = "c12-bg"; attr.type = 'error'; }
		if(attr.type=="WARNING"){ css = "c14-bg"; attr.type = 'warn'; }
		if(attr['class']) css = attr['class'];

		if(msg) this.log(attr.type,msg);

		var msgel = document.querySelector('.message');
		if(!msgel){
			msgel = document.createElement('div');
			msgel.classList.add('message');
			document.querySelector('header').insertAdjacentElement('afterend', msgel);
		}
	
		if(!msg){
			if(msgel){
				// Remove the specific message container
				if(msgel.querySelectorAll('#'+attr.id).length > 0) removeEl(msgel.querySelector('#'+attr.id));
			}
		}else if(msg){
			// We make a specific message container
			if(!msgel.querySelector('#'+attr.id)) appendHTML('<div id="'+attr.id+'"><div class="holder padded"></div></div>',msgel);
			msgel = msgel.querySelector('#'+attr.id);
			msgel.setAttribute('class',css);
			msgel.querySelector('.holder').innerHTML = msg;
		}
		return this;
	};

	this.setColours = function(key){
		var v,min,max,region;
		if(key){
			// Get range of data
			min = Infinity;
			max = -Infinity;
			if(this.numeric[key]){
				for(region in this.hex.mapping.hexes){
					v = null;
					if(this.numeric[key].type==="number"){
						if(typeof this.hex.mapping.hexes[region][key]==="number"){
							v = this.hex.mapping.hexes[region][key];
						}
					}else if(this.numeric[key].type==="date"){
						if(this.hex.mapping.hexes[region][key] && typeof this.hex.mapping.hexes[region][key]==="string"){
							if(!isNaN(Date.parse(this.hex.mapping.hexes[region][key]))) v = (new Date(this.hex.mapping.hexes[region][key])).getTime();
						}
					}
					if(typeof v==="number"){
						min = Math.min(v,min);
						max = Math.max(v,max);
					}
				}
			}
			this.log('info','Range: '+min+' to '+max+' for '+key,this.hex.mapping.hexes);
		}
		var _obj = this;

		this.hex.updateColours(function(region){
			var ok,v,c;
			c = '#444444';
			if(this.mapping.hexes[region].colour) c = this.mapping.hexes[region].colour;
			if(this.mapping.hexes[region].color) c = this.mapping.hexes[region].color;
			if(key && _obj.numeric[key]){
				v = this.mapping.hexes[region][key];
				ok = false;
				if(typeof v==="number"){
					ok = true;
				}else if(typeof v==="string"){
					if(_obj.numeric[key]){
						if(_obj.numeric[key].type==="date"){
							if(v.match(/^[0-9]{4}[-\/]?[0-9]{2}[-\/]?[0-9]{2}$/)){
								v = (new Date(v+'T12:00Z')).getTime();
								ok = true;
							}else if(v.match(/^[0-9]{4}[-\/]?[0-9]{2}[-\/]?[0-9]{2}T[0-9]{2}:[0-9]{2}/)){
								v = (new Date(v)).getTime();
								ok = true;
							}
						}
					}
				}
				if(ok) c = _obj.colours.getColourFromScale(_obj.colourscale,v,min,max);
				else c = (_obj.numeric[key] && _obj.numeric[key].type=="colour" ? v : null)||'darkgray';
			}
			return c;
		});

		// Update colour scale bar
		var el = document.querySelector('.scale');
		if(el) el.innerHTML = '<div class="scalebar" style="'+this.colours.getGradient(this.colourscale)+';height:1em;"></div><div class="min" style="float:left;border-left:1px solid '+this.colours.getColourFromScale(this.colourscale,0,0,100)+';padding-left: 0.25em;">'+(min != Infinity && typeof min!=="undefined" ? min : 'minimum')+'</div><div class="max"style="float:right;border-right:1px solid '+this.colours.getColourFromScale(this.colourscale,100,0,100)+';padding-right: 0.25em;">'+(max != -Infinity && typeof max!=="undefined" ? max : 'maximum')+'</div>';
		this.scalebar = el;
		return this.updateLink();
	};
	
	this.updateLink = function(){
		var el = document.getElementById('link');
		if(el){
			el.innerHTML = '<label for="view">Link to this view:</label><input type="text" class="view" id="view" onClick="this.setSelectionRange(0, this.value.length)" value="'+location.protocol + '//' + location.host + location.pathname+'?'+this.url+'&colourscale='+encodeURI(this.options.scale.value)+'&borders='+this.options.border.checked+'&attribute='+encodeURI(this.options.attrib.value)+'&labels='+this.query.labels+'" />';
		}
		return this;
	};
	
	/**
	 * CSVToArray parses any String of Data including '\r' '\n' characters,
	 * and returns an array with the rows of data.
	 * @param {String} CSV_string - the CSV string you need to parse
	 * @param {String} delimiter - the delimeter used to separate fields of data
	 * @returns {Array} rows - rows of CSV where first row are column headers
	 */
	function CSVToArray (CSV_string, delimiter) {
		delimiter = (delimiter || ","); // user-supplied delimeter or default comma

		var pattern = new RegExp( // regular expression to parse the CSV values.
			( // Delimiters:
				"(\\" + delimiter + "|\\r?\\n|\\r|^)" +
				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
				// Standard fields.
				"([^\"\\" + delimiter + "\\r\\n]*))"
			), "gi"
		);

		var rows = [[]];  // array to hold our data. First row is column headers.
		// array to hold our individual pattern matching groups:
		var matches = false; // false if we don't find any matches
		// Loop until we no longer find a regular expression match
		while (matches = pattern.exec( CSV_string )) {
			var matched_delimiter = matches[1]; // Get the matched delimiter
			// Check if the delimiter has a length (and is not the start of string)
			// and if it matches field delimiter. If not, it is a row delimiter.
			if (matched_delimiter.length && matched_delimiter !== delimiter) {
				// Since this is a new row of data, add an empty row to the array.
				rows.push( [] );
			}
			var matched_value;
			// Once we have eliminated the delimiter, check to see
			// what kind of value was captured (quoted or unquoted):
			if (matches[2]) { // found quoted value. unescape any double quotes.
				matched_value = matches[2].replace(
					new RegExp( "\"\"", "g" ), "\""
				);
			} else { // found a non-quoted value
				matched_value = matches[3];
			}
			// Now that we have our value string, let's add
			// it to the data array.
			rows[rows.length - 1].push(matched_value);
		}
		return rows; // Return the parsed data Array
	}

	// Function to parse a CSV file and return a JSON structure
	// Guesses the format of each column based on the data in it.
	function CSV2JSON(data,start,end){
		// Version 1.1

		// If we haven't sent a start row value we assume there is a header row
		if(typeof start!=="number") start = 1;
		// Split by the end of line characters
		if(typeof data==="string") data = CSVToArray(data);
		// The last row to parse
		if(typeof end!=="number") end = data.length;

		if(end > data.length){
			// Cut down to the maximum length
			end = data.length;
		}

		var line,datum,header,types;
		var newdata = [];
		var formats = [];
		var req = [];
		var j,i,k,rows;

		for(i = 0, rows = 0 ; i < end; i++){

			// If there is no content on this line we skip it
			if(data[i] == "") continue;

			line = data[i];

			datum = new Array(line.length);
			types = new Array(line.length);

			// Loop over each column in the line
			for(j=0; j < line.length; j++){

				// Replace undefined values with empty strings
				if(typeof line[j]==="undefined") line[j] = "";

				// Remove any quotes around the column value
				datum[j] = (line[j][0]=='"' && line[j][line[j].length-1]=='"') ? line[j].substring(1,line[j].length-1) : line[j];

				// If the value parses as a float
				if(typeof parseFloat(datum[j])==="number" && parseFloat(datum[j]) == datum[j]){
					types[j] = "float";
					// Check if it is actually an integer
					if(typeof parseInt(datum[j])==="number" && parseInt(datum[j])+"" == datum[j]){
						types[j] = "integer";
						// If it is an integer and in the range 1700-2100 we'll guess it is a year
						if(datum[j] >= 1700 && datum[j] < 2100) types[j] = "year";
					}
					datum[j] = parseFloat(datum[j]);
				}else if(datum[j].search(/^(true|false)$/i) >= 0){
					// The format is boolean
					types[j] = "boolean";
				}else if(datum[j].search(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/) >= 0){
					// The value looks like a URL
					types[j] = "URL";
				}else if(!isNaN(Date.parse(datum[j]))){
					// The value parses as a date
					types[j] = "datetime";
				}else{
					// Default to a string
					types[j] = "string";
					// If the string value looks like a time we set it as that
					if(datum[j].search(/^[0-2]?[0-9]\:[0-5][0-9]$/) >= 0) types[j] = "time";
				}
			}

			if(i == 0 && start > 0) header = datum;
			if(i >= start){
				newdata[rows] = datum;
				formats[rows] = types;
				rows++;
			}
		}
		
		// Now, for each column, we sum the different formats we've found
		var format = new Array(header.length);
		for(j = 0; j < header.length; j++){
			var count = {};
			var empty = 0;
			for(i = 0; i < newdata.length; i++){
				if(!newdata[i][j]) empty++;
			}
			for(i = 0 ; i < formats.length; i++){
				if(!count[formats[i][j]]) count[formats[i][j]] = 0;
				count[formats[i][j]]++;
			}
			var mx = 0;
			var best = "";
			for(k in count){
				if(count[k] > mx){
					mx = count[k];
					best = k;
				}
			}
			// Default
			format[j] = "string";

			// If more than 80% (arbitrary) of the values are a specific format we assume that
			if(mx > 0.8*newdata.length) format[j] = best;

			// If we have a few floats in with our integers, we change the format to float
			if(format[j] == "integer" && count.float > 0.1*newdata.length) format[j] = "float";

			req.push(header[j] ? true : false);

		}

		// Return the structured data
		return { 'fields': {'name':header,'title':clone(header),'format':format,'required':req }, 'rows': newdata };
	}

	// Function to clone a hash otherwise we end up using the same one
	function clone(hash) {
		var json = JSON.stringify(hash);
		var object = JSON.parse(json);
		return object;
	}

	function niceSize(b){
		if(b > 1e12) return (b/1e12).toFixed(2)+" TB";
		if(b > 1e9) return (b/1e9).toFixed(2)+" GB";
		if(b > 1e6) return (b/1e6).toFixed(2)+" MB";
		if(b > 1e3) return (b/1e3).toFixed(2)+" kB";
		return (b)+" bytes";
	}

	function gcd(srcWidth, srcHeight, ratio) {
		ratio = Math.min(ratio / srcWidth, ratio / srcHeight);
		return { width: srcWidth * ratio, height: srcHeight * ratio };
	}
	function SVG2PNG(el, opt) {
		var svg = el.outerHTML;
		var img = document.createElement("img");
		var url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
		img.src = url;
		img.setAttribute("style", "position:fixed;left:-200vw;");
		img.onload = function onload() {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			var rtn;
			rtn = gcd(
				img.width,
				img.height,
				Math.min(img.width, img.height)
			);
			canvas.width = rtn.width;
			canvas.height = rtn.height;
			ctx.drawImage(img, 0, 0, rtn.width, rtn.height);
			var src = canvas.toDataURL("image/png");
			var link = document.createElement('a');
			link.download = opt.src;
			link.href = src;
			link.click();
			img.remove();
			URL.revokeObjectURL(url);
			if(typeof opt.callback==="function") opt.callback.call(this,src);
		};
		document.body.appendChild(img);
	}

	return this;
}

function Menu(builder){

	this._builder = builder;
	this.control = builder.el.querySelector('.hex-control');
	if(!this.control){
		this.control = document.createElement('div');
		this.control.classList.add('hex-control');
		builder.hex.el.insertBefore(this.control, builder.hex.el.firstChild);
	}

	this.el = document.createElement('div');
	this.el.classList.add('b1-bg','hex-menu');
	this.control.appendChild(this.el);

	this.components = {};
	this.addComponent = function(name,comp){
		this.components[name] = comp;
		// Initialise it
		if(typeof comp.init==="function"){
			comp.init(this,builder);
			comp.el.classList.add('hex-menu-item');
		}
		return this;
	};
	this.append = function(el){
		this.el.appendChild(el);
		return this;
	};
	this.toggleComponent = function(name){
		if(this.components[name]) this.components[name].el.style.display = (this.components[name].el.style.display ? 'none' : '');
		return this;
	};

	return this;
}

function InfoBubble(){

	var active = true;
	this.el = document.createElement('div');
	this.el.classList.add('hex-info');
	this.btn = document.createElement('button');
	this.btn.classList.add('icon');
	this.el.appendChild(this.btn);

	this.init = function(menu, builder){
		// Add the main element for this component to the menu's element
		menu.append(this.el);

		// Add event
		var _obj = this;
		this.btn.addEventListener('click',function(e){
			if(active) _obj.deactivate();
			else _obj.activate();
		});

		this.activate = function(){
			this.btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m9.708 6.075-3.024.379-.108.502.595.108c.387.093.464.232.38.619l-.975 4.577c-.255 1.183.14 1.74 1.067 1.74.72 0 1.554-.332 1.933-.789l.116-.549c-.263.232-.65.325-.905.325-.363 0-.494-.255-.402-.704l1.323-6.208Zm.091-2.755a1.32 1.32 0 1 1-2.64 0 1.32 1.32 0 0 1 2.64 0Z"/></svg>';
			active = true;
		};
		this.deactivate = function(){
			this.btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m9.708 6.075-3.024.379-.108.502.595.108c.387.093.464.232.38.619l-.975 4.577c-.255 1.183.14 1.74 1.067 1.74.72 0 1.554-.332 1.933-.789l.116-.549c-.263.232-.65.325-.905.325-.363 0-.494-.255-.402-.704l1.323-6.208Zm.091-2.755a1.32 1.32 0 1 1-2.64 0 1.32 1.32 0 0 1 2.64 0Z"/><line x1="2" y1="13" x2="14" y2="3" stroke="currentColor" stroke-linecap="round" stroke-width="2" /></svg>';
			active = false;
			if(document.querySelector('.infobubble')) document.querySelector('.infobubble').remove();
		};

		this.activate();

		builder.hex.on('mouseover',{},function(e){
			if(active && e.data.type=="hex"){
				var el = document.querySelector('.infobubble');
				if(!el){
					var el = document.createElement('div');
					el.classList.add('infobubble');
					el.innerHTML = '<div class="infobubble_inner"></div>';
					_obj.el.appendChild(el);
				}
				el.querySelector('.infobubble_inner').innerHTML = builder.getLabel(e.data.data);
			}
		});
		return this;
	};
	this.addTo = function(m){
		m.addComponent("InfoBubble",this);
		return this;
	}
	return this;
}

function ColourPicker(){

	var active = false;

	this.el = document.createElement('div');
	this.el.classList.add('hex-colour-picker');
	this.el.style.display = 'none';

	var id = "colourpicker";

	this.init = function(menu, builder){

		// Add the main element for this component to the menu's element
		menu.append(this.el);

		this.inner = document.createElement('div');
		this.inner.classList.add('hex-colour-picker-inner');
		this.inner.classList.add('b1-bg');
		this.el.appendChild(this.inner);

		this.label = document.createElement('label');
		this.input = document.createElement('input');
		this.selall = document.createElement('button');
		this.selnone = document.createElement('button');

		this.label.innerHTML = "Change colour";
		this.label.style.textIndent = "-9999px";
		this.label.setAttribute('for',id);
		this.label.setAttribute('title','Change colour of selected hexes');

		this.input.setAttribute('type','color');
		this.input.setAttribute('id',id);
		this.input.style.display = 'none';

		this.selall.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 16 16"><path d="M 8 8 m -6.062 3.5 l 6.062 3.5 6.062 -3.5 0 -7 -6.062 -3.5 -6.062 3.5 0 7z" stroke-dasharray="2 1" /><path d="M 8 8 m -4 0 l 8 0 m -4 -4 l 0 8" /></svg>';
		this.selall.setAttribute('title','Select all hexes with the same colour as the last selection');
		this.selall.classList.add('b5-bg');
		this.selall.classList.add('icon');

		this.selnone.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 16 16"><path d="M 8 8 m -6.062 3.5 l 6.062 3.5 6.062 -3.5 0 -7 -6.062 -3.5 -6.062 3.5 0 7z" stroke-dasharray="2 1" /><path d="M 8 8 m -4 0 l 8 0" /></svg>';
		this.selnone.setAttribute('title','Deselect all hexes');
		this.selnone.classList.add('b5-bg');
		this.selnone.classList.add('icon');

		this.inner.appendChild(this.input);
		this.inner.appendChild(this.label);
		this.inner.appendChild(this.selall);
		this.inner.appendChild(this.selnone);

		// Add events
		var _obj = this;
		this.input.addEventListener('change',function(e){ _obj.changeColour(e.target.value); });
		this.selall.addEventListener('click',function(e){ builder.selectBySameColour(); e.target.blur(); });
		this.selnone.addEventListener('click',function(e){ builder.deselectAll(); e.target.blur(); });

		this.changeColour = function(c){
			this.label.style.backgroundColor = c;
			builder.changeSelectedColour(c);
			//return this.deactivate();
		};
		this.activate = function(){
			// Show the colour picking tool in the DOM
			if(menu) this.el.style.display = '';
			if(builder && builder.hex.selected){
				// Set the value to the current fill colour
				this.input.value = builder.hex.areas[builder.hex.selected].fillcolour;
				this.label.style.backgroundColor = this.input.value;
			}
			active = true;
			return this;
		};
		this.deactivate = function(){
			if(active){
				this.el.style.display = 'none';
				active = false;
			}
			return this;
		};

		builder.hex.on('click',{me:this,'test':2},function(e){
			if(e.data.type=="hex"){
				// Trigger the colour picker tool
				if(builder.hex.areas[e.data.region].selected) e.data.me.activate();
				else e.data.me.deactivate();
			}
		});
		
		return this;
	};
	
	this.addTo = function(m){
		m.addComponent("ColourPicker",this);
		return this;
	}
	return this;
}

/* ============== */
/* Colours v0.3.2 */
// Define colour routines
function Colour(c,n){
	if(!c) return {};
	function d2h(d) { return ((d < 16) ? "0" : "")+d.toString(16);}
	function h2d(h) {return parseInt(h,16);}
	/**
	 * Converts an RGB color value to HSV. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and v in the set [0, 1].
	 *
	 * @param	Number  r		 The red color value
	 * @param	Number  g		 The green color value
	 * @param	Number  b		 The blue color value
	 * @return  Array			  The HSV representation
	 */
	function rgb2hsv(r, g, b){
		r = r/255;
		g = g/255;
		b = b/255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, v = max;
		var d = max - min;
		s = max == 0 ? 0 : d / max;
		if(max == min) h = 0; // achromatic
		else{
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return [h, s, v];
	}

	this.alpha = 1;

	// Let's deal with a variety of input
	if(c.indexOf('#')==0){
		this.hex = c;
		this.rgb = [h2d(c.substring(1,3)),h2d(c.substring(3,5)),h2d(c.substring(5,7))];
	}else if(c.indexOf('rgb')==0){
		var bits = c.match(/[0-9\.]+/g);
		if(bits.length == 4) this.alpha = parseFloat(bits[3]);
		this.rgb = [parseInt(bits[0]),parseInt(bits[1]),parseInt(bits[2])];
		this.hex = "#"+d2h(this.rgb[0])+d2h(this.rgb[1])+d2h(this.rgb[2]);
	}else return {};
	this.hsv = rgb2hsv(this.rgb[0],this.rgb[1],this.rgb[2]);
	this.name = (n || "Name");
	var r,sat;
	for(r = 0, sat = 0; r < this.rgb.length ; r++){
		if(this.rgb[r] > 200) sat++;
	}
	this.toString = function(){
		return 'rgb'+(this.alpha < 1 ? 'a':'')+'('+this.rgb[0]+','+this.rgb[1]+','+this.rgb[2]+(this.alpha < 1 ? ','+this.alpha:'')+')';
	};
	this.text = (this.rgb[0]*0.299 + this.rgb[1]*0.587 + this.rgb[2]*0.114 > 186 ? "black":"white");
	return this;
}
function Colours(){
	var scales = {
		'Viridis': 'rgb(68,1,84) 0%, rgb(72,35,116) 10%, rgb(64,67,135) 20%, rgb(52,94,141) 30%, rgb(41,120,142) 40%, rgb(32,143,140) 50%, rgb(34,167,132) 60%, rgb(66,190,113) 70%, rgb(121,209,81) 80%, rgb(186,222,39) 90%, rgb(253,231,36) 100%'
	};
	function col(a){
		if(typeof a==="string") return new Colour(a);
		else return a;
	}
	this.getColourPercent = function(pc,a,b,inParts){
		var c;
		pc /= 100;
		a = col(a);
		b = col(b);
		c = {'r':parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc),'g':parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc),'b':parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc),'alpha':1};
		if(a.alpha<1 || b.alpha<1) c.alpha = ((b.alpha-a.alpha)*pc + a.alpha);
		if(inParts) return c;
		else return 'rgb'+(c.alpha && c.alpha<1 ? 'a':'')+'('+c.r+','+c.g+','+c.b+(c.alpha && c.alpha<1 ? ','+c.alpha:'')+')';
	};
	this.makeGradient = function(a,b){
		a = col(a);
		b = col(b);
		var grad = a.toString()+' 0%, '+b.toString()+' 100%';
		if(b) return 'background: '+a.toString()+'; background: -moz-linear-gradient(left, '+grad+');background: -webkit-linear-gradient(left, '+grad+');background: linear-gradient(to right, '+grad+');';
		else return 'background: '+a.toString()+';';
	};
	this.getGradient = function(id){
		return 'background: -moz-linear-gradient(left, '+scales[id].str+');background: -webkit-linear-gradient(left, '+scales[id].str+');background: linear-gradient(to right, '+scales[id].str+');';
	};
	this.addScale = function(id,str){
		scales[id] = str;
		processScale(id,str);
		return this;
	};
	this.quantiseScale = function(id,n,id2){
		var cs,m,pc,step,i;
		cs = [];
		m = n-1;
		pc = 0;
		step = 100/n;
		for(i = 0; i < m; i++){
			cs.push(this.getColourFromScale(id,i,0,m)+' '+(pc)+'%');
			cs.push(this.getColourFromScale(id,i,0,m)+' '+(pc+step)+'%');
			pc += step;
		}
		cs.push(this.getColourFromScale(id,1,0,1)+' '+(pc)+'%');
		cs.push(this.getColourFromScale(id,1,0,1)+' 100%');
		this.addScale(id2,cs.join(", "));
		return this;
	};
	function processScale(id,str){
		if(scales[id] && scales[id].str){
			console.warn('Colour scale '+id+' already exists. Bailing out.');
			return this;
		}
		scales[id] = {'str':str};
		scales[id].stops = extractColours(str);
		return this;
	}
	function extractColours(str){
		var stops,cs,i,c;
		stops = str.replace(/^\s+/g,"").replace(/\s+$/g,"").replace(/\s\s/g," ").split(', ');
		cs = [];
		for(i = 0; i < stops.length; i++){
			var bits = stops[i].split(/ /);
			if(bits.length==2) cs.push({'v':bits[1],'c':new Colour(bits[0])});
			else if(bits.length==1) cs.push({'c':new Colour(bits[0])});
		}
		
		for(c=0; c < cs.length;c++){
			if(cs[c].v){
				// If a colour-stop has a percentage value provided, 
				if(cs[c].v.indexOf('%')>=0) cs[c].aspercent = true;
				cs[c].v = parseFloat(cs[c].v);
			}
		}
		return cs;
	}

	// Process existing scales
	for(var id in scales){
		if(scales[id]) processScale(id,scales[id]);
	}
	
	// Return a Colour object for a string
	this.getColour = function(str){
		return new Colour(str);
	};
	// Return the colour scale string
	this.getColourScale = function(id){
		return scales[id].str;
	};
	// Return the colour string for this scale, value and min/max
	this.getColourFromScale = function(s,v,min,max,inParts){
		var cs,v2,pc,c,cfinal;
		if(typeof inParts!=="boolean") inParts = false;
		if(!scales[s]){
			this.log('WARNING','No colour scale '+s+' exists');
			return '';
		}
		if(typeof v!=="number") v = 0;
		if(typeof min!=="number") min = 0;
		if(typeof max!=="number") max = 1;
		cs = scales[s].stops;
		v2 = 100*(v-min)/(max-min);
		cfinal = {};
		if(v==max){
			cfinal = {'r':cs[cs.length-1].c.rgb[0],'g':cs[cs.length-1].c.rgb[1],'b':cs[cs.length-1].c.rgb[2],'alpha':cs[cs.length-1].c.alpha};
		}else{
			if(cs.length == 1){
				cfinal = {'r':cs[0].c.rgb[0],'g':cs[0].c.rgb[1],'b':cs[0].c.rgb[2],'alpha':(v2/100).toFixed(3)};
			}else{
				for(c = 0; c < cs.length-1; c++){
					if(v2 >= cs[c].v && v2 <= cs[c+1].v){
						// On this colour stop
						pc = 100*(v2 - cs[c].v)/(cs[c+1].v-cs[c].v);
						if(pc > 100) pc = 100;	// Don't go above colour range
						cfinal = this.getColourPercent(pc,cs[c].c,cs[c+1].c,true);
						continue;
					}
				}
			}
		}
		if(inParts) return cfinal;
		else return 'rgba(' + cfinal.r + ',' + cfinal.g + ',' + cfinal.b + ',' + cfinal.alpha + ")";
	};
	
	return this;
}
