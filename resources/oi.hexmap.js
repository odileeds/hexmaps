/**
	OI hex map in SVG
	Version 0.6.0
 */
(function(root){

	var OI = root.OI || {};
	if(!OI.ready){
		OI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}
	function AJAX(url,opt){
		// Version 1.1
		if(!opt) opt = {};
		var req = new XMLHttpRequest();
		var responseTypeAware = 'responseType' in req;
		if(responseTypeAware && opt.dataType) req.responseType = opt.dataType;
		req.open((opt.method||'GET'),url+(opt.cache ? '?'+Math.random() : ''),true);
		req.onload = function(e){
			if(this.status >= 200 && this.status < 400) {
				// Success!
				var resp = this.response;
				if(typeof opt.success==="function") opt.success.call((opt['this']||this),resp,{'url':url,'data':opt,'originalEvent':e});
			}else{
				// We reached our target server, but it returned an error
				if(typeof opt.error==="function") opt.error.call((opt['this']||this),e,{'url':url,'data':opt});
			}
		};
		if(typeof opt.error==="function"){
			// There was a connection error of some sort
			req.onerror = function(err){ opt.error.call((opt['this']||this),err,{'url':url,'data':opt}); };
		}
		req.send();
		return this;
	}
	if(!OI.ajax) OI.ajax = AJAX;

	// Input structure:
	//    el: the element to attach to
	//    attr: an object defining various parameters:
	//      width: the width of the SVG element created
	//      height: the height of the SVG element created
	//      padding: an integer number of hexes to leave as padding around the displayed map
	//      grid: do we show the background grid?
	//      clip: do we clip the text to the hex?
	//      formatLabel: a function to format the hex label
	//      size: the size of a hexagon in pixels
	function HexMap(el,attr){

		this.version = "0.6.0";
		if(!attr) attr  = {};
		this._attr = attr;
		this.title = "OI HexMap";
		this.logging = (location.search.indexOf('debug=true') >= 0);
		this.log = function(){
			// Version 1.1
			if(this.logging || arguments[0]=="ERROR" || arguments[0]=="WARNING"){
				var args = Array.prototype.slice.call(arguments, 0);
				// Build basic result
				var extra = ['%c'+this.title+'%c: '+args[1],'font-weight:bold;',''];
				// If there are extra parameters passed we add them
				if(args.length > 2) extra = extra.concat(args.splice(2));
				if(console && typeof console.log==="function"){
					if(arguments[0] == "ERROR") console.error.apply(null,extra);
					else if(arguments[0] == "WARNING") console.warn.apply(null,extra);
					else if(arguments[0] == "INFO") console.info.apply(null,extra);
					else console.log.apply(null,extra);
				}
			}
			return this;
		};

		if(!el){
			this.log('ERROR','Unable to find the element to draw into',el);
			return this;
		}

		if(!attr.label) attr.label = {};
		if(!attr.grid) attr.grid = {};
		if(typeof attr.label.show!=="boolean") attr.label.show = false;
		if(typeof attr.label.clip!=="boolean") attr.label.clip = false;
		if(typeof attr.grid.show!=="boolean") attr.grid.show = false;

		var wide = attr.width || el.offsetWidth || 300;
		var tall = attr.height || el.offsetHeight || 150;
		this.maxw = wide;
		this.maxh = tall;
		var aspectratio = wide/tall;
		var constructed = false;
		var svg;
		var range = {};
		var fs = parseFloat(getComputedStyle(el)['font-size'])||16;
		this.areas = {};
		this.padding = (typeof attr.padding==="number" ? attr.padding : 0);
		this.properties = { 'size': attr.size };
		this.callback = {};
		this.mapping = {};

		
		// Add an inner element
		if(!el.querySelector('.hexmap-inner')){
			this.el = document.createElement('div');
			this.el.classList.add('hexmap-inner');
			el.appendChild(this.el);
		}

		this.options = {
			'clip': attr.label.clip,
			'showgrid': attr.grid.show,
			'showlabel': attr.label.show,
			'formatLabel': (typeof attr.label.format==="function" ? attr.label.format : function(txt,attr){ return txt.substr(0,3); }),
			'minFontSize': (typeof attr.minFontSize==="number" ? attr.minFontSize : 4)
		};

		this.style = {
			'default': { 'fill': '#cccccc','fill-opacity':(this.options.showlabel ? 0.5 : 1),'font-size':fs,'stroke-width':1.5,'stroke-opacity':1,'stroke':'#ffffff' },
			'highlight': { 'fill': '#1DD3A7' },
			'grid': { 'fill': '#aaa','fill-opacity':0.1 }
		};

		for(var s in attr.style){
			if(attr.style[s]){
				if(!this.style[s]) this.style[s] = {};
				if(attr.style[s].fill) this.style[s].fill = attr.style[s].fill;
				if(attr.style[s]['fill-opacity']) this.style[s]['fill-opacity'] = attr.style[s]['fill-opacity'];
				if(attr.style[s]['font-size']) this.style[s]['font-size'] = attr.style[s]['font-size'];
				if(attr.style[s].stroke) this.style[s].stroke = attr.style[s].stroke;
				if(attr.style[s]['stroke-width']) this.style[s]['stroke-width'] = attr.style[s]['stroke-width'];
				if(attr.style[s]['stroke-opacity']) this.style[s]['stroke-opacity'] = attr.style[s]['stroke-opacity'];
			}
		}
		this.setHexSize = function(s){
			if(typeof s!=="number") s = 10;
			s = Math.round(100*s)/100;
			attr.size = s;
			this.properties.size = s;
			return this;
		};

		// Can load a file or a hexjson data structure
		this.load = function(file,prop,fn){
			if(typeof prop==="function" && !fn){
				fn = prop;
				prop = "";
			}
			//if(typeof fn !== "function") return this;
			function done(data,noload){
				_obj.log('INFO','HexJSON',data);
				_obj.setMapping(data);
				if(noload) _obj.updateColours();
				if(typeof fn==="function") fn.call(_obj,{'data':prop});
			}
			if(typeof file==="string"){
				this.log('INFO','Loading '+file,prop,fn);
				OI.ajax(file,{
					'this': this,
					'dataType':'json',
					'success': function(data){ done(data); },
					'error': function(e,prop){ this.log('ERROR','Unable to load '+file,prop); }
				});
			}else if(typeof file==="object") done(file,true);
			return this;
		};

		var _obj = this;
		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize', function(event){ _obj.size(); });

		this.setHexStyle = function(r){
			var h,style,cls,p;
			h = this.areas[r];
			style = clone(this.style['default']);
			cls = "";
			if(h.active) style.fill = h.fillcolour;
			if(h.hover) cls += ' hover';
			if(h.selected){
				for(p in this.style.selected){
					if(this.style.selected[p]) style[p] = this.style.selected[p];
				}
				cls += ' selected';
			}
			if(this.mapping.hexes[r]['class']) cls += " "+this.mapping.hexes[r]['class'];
			if(this.search.active) cls += (h.highlight) ? ' highlighted' : ' not-highlighted';
			style['class'] = 'hex-cell'+cls;
			setAttr(h.hex,style);
			if(h.label) setAttr(h.label,{'class':'hex-label'+cls});
			return h;
		};
		
		function setClip(h){
			var sty = getComputedStyle(h.hex);
			var s = {};
			if(sty.transform) s.transform = sty.transform;
			if(s.transform=="none") s.transform = "";
			if(sty['transform-origin']) s['transform-origin'] = sty['transform-origin'];
			setAttr(h.clip,s);
		}
		
		this.toFront = function(region){
			if(this.areas[region]){
				// Simulate a change of z-index by moving elements to the end of the SVG
				// Keep selected items on top
				for(var r in this.areas){
					if(this.areas[r]){
						if(this.areas[r].selected) add(this.areas[r].g,svg);
						if(this.options.clip) setClip(this.areas[r]);
					}
				}
				// Simulate a change of z-index by moving this element (hex and label) to the end of the SVG
				add(this.areas[region].g,svg);
			}
			return this;
		};

		this.regionToggleSelected = function(r,others){
			this.selected = (this.selected==r) ? "" : r;
			var region,h;
			h = this.areas[r];
			h.selected = !h.selected;
			this.setHexStyle(r);

			// If we've deselected a region, deselect any other regions selected
			if(!h.selected){
				if(others){
					for(region in this.areas){
						if(this.areas[region].selected){
							this.areas[region].selected = false;
							this.setHexStyle(region);
						}
					}
				}
			}
			return this;
		};

		this.regionFocus = function(r){
			this.areas[r].hover = true;
			this.el.querySelectorAll('.hover').forEach(function(el){ el.classList.remove('hover'); });
			this.setHexStyle(r);
			this.toFront(r);
			return this;
		};

		this.regionBlur = function(r){
			this.areas[r].hover = false;
			this.setHexStyle(r);
			return this;
		};

		this.regionActivate = function(r){
			this.areas[r].active = true;
			this.setHexStyle(r);
		};

		this.regionDeactivate = function(r){
			this.areas[r].active = false;
			this.setHexStyle(r);
		};

		this.regionToggleActive = function(r){
			this.areas[r].active = !this.areas[r].active;
			this.setHexStyle(r);
		};

		this.selectRegion = function(r){
			this.selected = r;
			for(var region in this.areas){
				if(this.areas[region]){
					if(r.length > 0 && region.indexOf(r)==0){
						this.areas[region].selected = true;
						this.setHexStyle(region);
					}else{
						this.areas[region].selected = false;
						this.setHexStyle(region);
					}
				}
			}
			return this;
		};

		// Add events (mouseover, mouseout, click)	
		this.on = function(type,prop,fn){
			if(typeof prop==="function" && !fn){
				fn = prop;
				prop = "";
			}
			if(typeof fn !== "function") return this;
			if(!this.callback) this.callback = {};
			this.callback[type] = { 'fn': fn, 'attr': prop };
			return this;
		};
		// Move the selected hex to the new coordinates
		this.moveTo = function(q,r){
			console.log('moveTo',q,r,this,this.selected);
			if(this.selected){
				var dq = q - this.mapping.hexes[this.selected].q;
				var dr = r - this.mapping.hexes[this.selected].r;

				for(var region in this.areas){
					if(this.areas[region]){
						if(region.indexOf(this.selected)==0){
							this.areas[region].selected = true;
						}
						if(this.areas[region].selected){
							this.mapping.hexes[region].q += dq;
							this.mapping.hexes[region].r += dr;
							var h = this.drawHex(this.mapping.hexes[region].q,this.mapping.hexes[region].r);
							this.areas[region].hex.setAttribute('d',h.path);
							this.areas[region].array = h.array;
							if(this.options.showlabel && this.areas[region].label){
								setAttr(this.areas[region].label,{'x':h.x,'y':h.y,'clip-path':'hex-clip-'+this.mapping.hexes[region].q+'-'+this.mapping.hexes[region].r});
							}
							this.areas[region].selected = false;
							this.setHexStyle(region);
						}
					}
				}
				this.selected = "";
			}
		};
		this.size = function(w,h){
			this.el.style.height = '';
			this.el.style.width = '';
			setAttr(el,{'style':''});
			if(svg) setAttr(svg,{'width':0,'height':0});
			w = Math.min(this.maxw,el.offsetWidth);
			this.el.style.height = (w/aspectratio)+'px';
			this.el.style.width = w+'px';
			h = Math.min(this.maxh,this.el.offsetHeight);
			
			// Create SVG container
			if(!svg){
				svg = svgEl('svg');
				setAttr(svg,{'xmlns':ns,'version':'1.1','overflow':'visible','viewBox':(attr.viewBox||'0 0 '+w+' '+h),'style':'max-width:100%;','preserveAspectRatio':'xMinYMin meet','vector-effect':'non-scaling-stroke'});
				add(svg,this.el);
			}
			setAttr(svg,{'width':w,'height':h});
			
			var scale = w/wide;
			this.properties.size = attr.size*scale;
			wide = w;
			tall = h;
			this.el.style.height = '';
			this.el.style.width = '';

			return this;
		};

		function Search(attr){

			if(!attr) attr = {};
			this.attr = attr;
			this.el = '';
			this.active = false;
			this.selected = -1;

			this.init = function(){

				if(this.attr.id) this.el = S('#'+this.attr.id);
				if(this.el.length == 0){
					S('#'+_obj.id).append('<div class="hex-search"></div>');
					this.el = S('#'+_obj.id+' .hex-search');
				}

				if(this.el.find('.search-button').length==0) this.el.append('<label class="search-button" for="areas"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 12 13"><g stroke-width="2" stroke="white" fill="none"><path d="M11.29 11.71l-4-4"></path><circle cx="5" cy="5" r="4"></circle></g></svg></label>');
				if(this.el.find('.search-input').length==0) this.el.append('<input type="text" class="search-input" name="areas" id="areas" value="">');

				this.el.find('.search-button').on('click',{hexmap:_obj,me:this},function(e){
					e.data.me.selected = -1;
					e.data.me.toggle();
				});
				this.el.find('.search-input').on('keyup',{hexmap:_obj,me:this},function(e){
					var value = e.currentTarget.value.toLowerCase();
					var regions = {};
					var li = "";
					var n = 0;
					var v;
					var areas = e.data.hexmap.areas;
					console.log(value,e.data);

					if(value.length > 1){
						for(var region in areas){
							console.log(region,areas[region])
							v = areas[region].data.title||"";
							n = e.data.hexmap.mapping.hexes[region].name;
							if(v.toLowerCase().indexOf(value)>=0 || n.toLowerCase().indexOf(value)>=0){
								regions[region] = true;
								if(n < 8){
									li += '<li><a href="#" data="'+region+'">'+v+'</a></li>';
									n++;
								}
							}
						}
					}
					if(e.originalEvent.keyCode==40 || e.originalEvent.keyCode==38){
						// Down=40
						// Up=38
						if(e.originalEvent.keyCode==40) e.data.me.selected++;
						if(e.originalEvent.keyCode==38) e.data.me.selected--;
						n = e.data.me.el.find('.search-results a').length;
						if(e.data.me.selected < 0) e.data.me.selected = 0;
						if(e.data.me.selected >= n) e.data.me.selected = n-1;
						e.data.me.el.find('.search-results a').removeClass('selected');
						S(e.data.me.el.find('.search-results a')[e.data.me.selected]).addClass('selected');
					
					}else if(e.originalEvent.keyCode==13){
						e.data.me.el.find('.search-results a.selected').trigger('click');
					}else{
						// Add list of options
						if(e.data.me.el.find('.search-results').length==0) e.data.me.el.find('.search-input').after('<ul class="search-results">BLAH</ul>');
						e.data.me.el.find('.search-results').html(li);
						e.data.me.el.find('.search-results a').on('click',{'me':e.data.me,'builder':e.data.hexmap},function(e){
							e.preventDefault();
							e.stopPropagation();
							// Trigger the click event on the appropriate hex
							e.data.builder.hexes[e.currentTarget.getAttribute('data')].el.trigger('click');
							// Remove the search results
							e.data.me.el.find('.search-results').remove();
						});

						e.data.me.highlight(regions);
					}
					
				});
			};
			this.toggle = function(){
				this.active = !this.active;
				
				if(this.active){
					this.el.addClass('searching');
					this.el.find('.search-input')[0].focus();
					// Force the cursor to go to the end by clearing and resetting
					var v = this.el.find('.search-input')[0].value;
					this.el.find('.search-input')[0].value = '';
					this.el.find('.search-input')[0].value = v;
					if(this.el.find('.search-input')[0].value) this.el.find('.search-input').trigger('keyup');
				}else{
					this.el.removeClass('searching');
					this.highlight({});
					// Remove the search results
					this.el.find('.search-results').remove();
				}
			};

			this.highlight = function(rs){
				this.n = 0;
				var region;
				for(region in rs){
					if(rs[region]) this.n++;
				}
				for(region in _obj.hexes){
					if(this.n>0){
						if(rs[region]){
							_obj.hexes[region].highlight = true;//(rs[region]);
							_obj.hexes[region].attr({'class':'hex-cell highlighted'});
						}else{
							_obj.hexes[region].highlight = false;
							_obj.hexes[region].attr({'class':'hex-cell not-highlighted'});
						}
					}else{
						_obj.hexes[region].highlight = false;
						_obj.hexes[region].attr({'class':'hex-cell'});
					}
				}

				return this;
			};

			this.init();

			return this;
		}
		this.initialized = function(){
			this.create().draw();
			var spin = el.querySelector('.spinner');
			if(spin) spin.parentNode.removeChild(spin);
			return this;
		};

		this.create = function(){
			// Clear the canvas
			svg.innerHTML = "";
			this.areas = {};
			constructed = false;
			return this;
		};
		
		function updatePos(q,r,layout){
			if(layout=="odd-r" && (r%2) != 0) q += 0.5;  // "odd-r" horizontal layout shoves odd rows right
			if(layout=="even-r" && (r%2) == 0) q += 0.5; // "even-r" horizontal layout shoves even rows right
			if(layout=="odd-q" && (q%2) != 0) r += 0.5;  // "odd-q" vertical layout shoves odd columns down
			if(layout=="even-q" && (q%2) == 0) r += 0.5; // "even-q" vertical layout shoves even columns down
			return {'q':q,'r':r};
		}

		this.setMapping = function(mapping){
			var region,p,s;
			this.mapping = mapping;
			if(!this.properties) this.properties = { "x": 100, "y": 100 };
			p = mapping.layout.split("-");
			this.properties.shift = p[0];
			this.properties.orientation = p[1];
			
			range = { 'r': {'min':1e100,'max':-1e100}, 'q': {'min':1e100,'max':-1e100} };
			for(region in this.mapping.hexes){
				if(this.mapping.hexes[region]){
					p = updatePos(this.mapping.hexes[region].q,this.mapping.hexes[region].r,this.mapping.layout);
					if(p.q > range.q.max) range.q.max = p.q;
					if(p.q < range.q.min) range.q.min = p.q;
					if(p.r > range.r.max) range.r.max = p.r;
					if(p.r < range.r.min) range.r.min = p.r;
				}
			}
			// Find range and mid points
			range.q.d = range.q.max-range.q.min;
			range.r.d = range.r.max-range.r.min;
			range.q.mid = range.q.min + range.q.d/2;
			range.r.mid = range.r.min + range.r.d/2;
			this.range = clone(range);

			if(this.properties.orientation=="r") s = Math.min(0.5*tall/(range.r.d*0.75 + 1),(1/Math.sqrt(3))*wide/(range.q.d + 1));	// Pointy-topped
			else s = Math.min((1/Math.sqrt(3))*tall/(range.r.d + 1),0.5*wide/(range.q.d*0.75 + 1));	// Flat-topped

			if(typeof attr.size!=="number") this.setHexSize(s);
			this.setSize();

			return this.initialized();
		};

		this.setSize = function(size){
			if(size) this.properties.size = size;
			this.properties.s = { 'cos': Math.round(10*this.properties.size*Math.sqrt(3)/2)/10, 'sin': this.properties.size*0.5 };
			this.properties.s.c = this.properties.s.cos.toFixed(2);
			this.properties.s.s = this.properties.s.sin.toFixed(2);
			return this;
		};

		this.drawHex = function(q,r){
			if(this.properties){
				var x,y,cs,ss,path,p;
				cs = this.properties.s.cos;
				ss = this.properties.s.sin;

				p = updatePos(q,r,this.mapping.layout);

				if(this.properties.orientation=="r"){
					// Pointy topped
					x = (wide/2) + ((p.q-this.range.q.mid) * cs * 2);
					y = (tall/2) - ((p.r-this.range.r.mid) * ss * 3);
				}else{
					// Flat topped
					x = (wide/2) + ((p.q-this.range.q.mid) * ss * 3);
					y = (tall/2) - ((p.r-this.range.r.mid) * cs * 2);
				}
				x = parseFloat(x.toFixed(1));
				path = [['M',[x,y]]];
				if(this.properties.orientation == "r"){
					// Pointy topped
					path.push(['m',[cs,-ss]]);
					path.push(['l',[0,2*ss,-cs,ss,-cs,-ss,0,-2*ss,cs,-ss,cs,ss]]);
					path.push(['z',[]]);
				}else{
					// Flat topped
					path.push(['m',[-ss,cs]]);
					path.push(['l',[2*ss,0,ss,-cs,-ss,-cs,-2*ss,0,-ss,cs]]);
					path.push(['z',[]]);
				}
				return { 'array':path,'path':toPath(path),'x':x,'y':y };
			}
			return this;
		};

		this.updateColours = function(fn){
			var r,fill;
			if(typeof fn!=="function") fn = function(){ return this.style['default'].fill; };
			for(r in this.mapping.hexes){
				if(this.mapping.hexes[r]){
					fill = this.style['default'].fill;
					if(this.mapping.hexes[r].colour) fill = this.mapping.hexes[r].colour;					
					if(typeof attr.colours==="string") fill = attr.colours;
					if(typeof fn==="function") fill = fn.call(this,r);
					this.areas[r].fillcolour = fill;
					this.setHexStyle(r);
				}
			}
			return this;
		};
		
		this.draw = function(){			
			var r,q,h,hex;

			var range = this.range;
			for(region in this.mapping.hexes){
				if(this.mapping.hexes[region]){
					q = this.mapping.hexes[region].q;
					r = this.mapping.hexes[region].r;
					if(q > range.q.max) range.q.max = q;
					if(q < range.q.min) range.q.min = q;
					if(r > range.r.max) range.r.max = r;
					if(r < range.r.min) range.r.min = r;
				}
			}
			
			// Add padding to range
			range.q.min -= this.padding;
			range.q.max += this.padding;
			range.r.min -= this.padding;
			range.r.max += this.padding;
		
			// q,r coordinate of the centre of the range
			var qp = (range.q.max+range.q.min)/2;
			var rp = (range.r.max+range.r.min)/2;
			
			this.properties.x = (this.w/2) - (this.properties.s.cos * 2 *qp);
			this.properties.y = (this.h/2) + (this.properties.s.sin * 3 *rp);

			// Store this for use elsewhere
			this.range = clone(range);

			function ev(e,t){
				if(e.data.hexmap.callback[t]){
					for(var a in e.data.hexmap.callback[t].attr){
						if(e.data.hexmap.callback[t].attr[a]) e.data[a] = e.data.hexmap.callback[t].attr[a];
					}
					if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(e.data['this']||this,e);
				}				
			}
			var events = {
				'mouseover': function(e){ if(e.data.region){ e.data.hexmap.regionFocus(e.data.region); } ev(e,'mouseover'); },
				'mouseout': function(e){ ev(e,'mouseout'); },
				'click': function(e){ if(e.data.region){ e.data.hexmap.regionFocus(e.data.region); } ev(e,'click'); }
			};
			if((this.options.showgrid || this.options.clip) && !this.grid){
				this.grid = svgEl('g');
				setAttr(this.grid,{'class':'hex-grid-holder'});
				for(q = range.q.min-1; q <= range.q.max+1; q++){
					for(r = range.r.min-1; r <= range.r.max+1; r++){
						h = this.drawHex(q,r);
						if(this.options.showgrid){
							hex = svgEl('path');
							setAttr(hex,{'d':h.path,'class':'hex-grid','data-q':q,'data-r':r,'fill':(this.style.grid.fill||''),'fill-opacity':(this.style.grid['fill-opacity']||0.1),'stroke':(this.style.grid.stroke||'#aaa'),'stroke-opacity':(this.style.grid['stroke-opacity']||0.2)});
							add(hex,this.grid);
							addEvent('mouseover',hex,{type:'grid',hexmap:this,data:{'r':r,'q':q}},events.mouseover);
							addEvent('mouseout',hex,{type:'grid',hexmap:this,me:_obj,data:{'r':r,'q':q}},events.mouseout);
							addEvent('click',hex,{type:'grid',hexmap:this,me:_obj,data:{'r':r,'q':q}},events.click);
						}
					}
				}
				add(this.grid,svg);
			}

			var min,max,_obj,defs,path,label,hexclip,id;
			min = 50000;
			max = 80000;
			_obj = this;
			defs = svgEl('defs');
			add(defs,svg);
			id = (el.getAttribute('id')||'hex');

			for(r in this.mapping.hexes){
				if(this.mapping.hexes[r]){

					h = this.drawHex(this.mapping.hexes[r].q,this.mapping.hexes[r].r);

					if(!constructed){
						g = svgEl('g');
						setAttr(g,{'data':r});
						svg.appendChild(g);
						path = svgEl('path');
						path.innerHTML = '<title>'+(this.mapping.hexes[r].n || r)+'</title>';
						setAttr(path,{'d':h.path,'class':'hex-cell','transform-origin':h.x+'px '+h.y+'px','data-q':this.mapping.hexes[r].q,'data-r':this.mapping.hexes[r].r});
						g.appendChild(path);
						this.areas[r] = {'g':g,'hex':path,'selected':false,'active':true,'data':this.mapping.hexes[r],'orig':h};

						// Attach events to our SVG group nodes
						addEvent('mouseover',g,{type:'hex',hexmap:this,region:r,data:this.mapping.hexes[r],pop:this.mapping.hexes[r].p},events.mouseover);
						addEvent('mouseout',g,{type:'hex',hexmap:this,region:r,me:this.areas[r]},events.mouseout);
						addEvent('click',g,{type:'hex',hexmap:this,region:r,me:this.areas[r],data:this.mapping.hexes[r]},events.click);

						if(this.options.showlabel){
							if(this.style['default']['font-size'] >= this.options.minFontSize){
								if(this.options.clip){
									// Make all the clipping areas
									this.areas[r].clipid = (el.getAttribute('id')||'hex')+'-clip-'+r;
									this.areas[r].clip = svgEl('clipPath');
									this.areas[r].clip.setAttribute('id',this.areas[r].clipid);
									hexclip = svgEl('path');
									setAttr(hexclip,{'d':h.path,'transform-origin':h.x+'px '+h.y+'px'});
									add(hexclip,this.areas[r].clip);
									add(this.areas[r].clip,defs);
								}
								label = svgEl('text');
								// Add to DOM
								g.appendChild(label);
								label.innerHTML = this.options.formatLabel(this.mapping.hexes[r].n||this.mapping.hexes[r].msoa_name_hcl,{'x':h.x,'y':h.y,'hex':this.mapping.hexes[r],'size':this.properties.size,'font-size':parseFloat(getComputedStyle(label)['font-size'])});
								setAttr(label,{'x':h.x,'y':h.y,'transform-origin':h.x+'px '+h.y+'px','dominant-baseline':'central','clip-path':'url(#'+this.areas[r].clipid+')','data-q':this.mapping.hexes[r].q,'data-r':this.mapping.hexes[r].r,'class':'hex-label','text-anchor':'middle','font-size':this.style['default']['font-size']+'px','title':(this.mapping.hexes[r].n || r),'_region':r});
								this.areas[r].label = label;
								this.areas[r].labelprops = {x:h.x,y:h.y};
							}
						}

					}
					this.setHexStyle(r);
					setAttr(this.areas[r].hex,{'stroke':this.style['default'].stroke,'stroke-opacity':this.style['default']['stroke-opacity'],'stroke-width':this.style['default']['stroke-width'],'title':this.mapping.hexes[r].n,'data-regions':r,'style':'cursor: pointer;'});
				}
			}

			constructed = true;

			return this;
		};

		document.addEventListener('keypress',function(e){
			e.stopPropagation();
			if(e.key=="c") _obj.selectBySameColour(e);
		});

		this.selectBySameColour = function(){
			if(this.selected){
				for(var region in this.areas){
					if(this.areas[region].fillcolour==this.areas[this.selected].fillcolour){
						this.areas[region].selected = true;
						this.setHexStyle(region);
					}
				}
			}
			return this;
		};
		
		this.size();
		if(attr.hexjson) this.load(attr.hexjson,attr.ready);


		this.search = new Search(attr.search);
		return this;
	
	}
	OI.hexmap = HexMap;

	// Helper functions
	var ns = 'http://www.w3.org/2000/svg';
	function prepend(el,to) { to.insertBefore(el, to.firstChild); }
	function add(el,to){ return to.appendChild(el); }
	function clone(a){ return JSON.parse(JSON.stringify(a)); }
	function setAttr(el,prop){
		for(var p in prop){
			if(prop[p]) el.setAttribute(p,prop[p]);
		}
		return el;
	}
	function svgEl(t){ return document.createElementNS(ns,t); }
	function addEvent(ev,el,attr,fn){
		if(el){
			if(!el.length) el = [el];
			if(typeof fn==="function"){
				el.forEach(function(elem){
					elem.addEventListener(ev,function(e){
						e.data = attr;
						fn.call(attr['this']||this,e);
					});
				});
			}
		}
	}
	function toPath(p) {
		var str = '';
		for(var i = 0; i < p.length; i++) str += ((p[i][0]) ? p[i][0] : ' ')+(p[i][1].length > 0 ? p[i][1].join(',') : ' ');
		return str;
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

	root.Colours = Colours;
	root.OI = OI;

})(window || this);