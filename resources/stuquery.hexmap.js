// Display a hex map
// Requires stuquery.svg.js to be loaded first
// Input structure:
//    id: the ID for the HTML element to attach this to
//    width: the width of the SVG element created
//    height: the height of the SVG element created
//    padding: an integer number of hexes to leave as padding around the displayed map
//    showgrid: do we show the background grid?
//    formatLabel: a function to format the hex label
//    size: the size of a hexagon in pixels
function HexMap(attr){

	this.version = "0.4";
	if(!attr) attr  = {};
	this._attr = attr;
	if(S('#'+attr.id).length==0){
		console.log("Can't find the element to draw into (#"+attr.id+")");
		return {};
	}

	this.w = attr.width || 300;
	this.h = attr.height || 150;
	this.maxw = this.w;
	this.maxh = this.h;
	this.s = attr.size || 10;
	this.aspectratio = this.w/this.h;
	this.id = attr.id;
	this.hexes = {};
	this.min = 0;
	this.max = 1;
	this.padding = (typeof attr.padding==="number" ? attr.padding : 0);
	this.properties = { 'size': (typeof attr.size==="number" ? attr.size : 10) };
	
	var fs = (typeof attr.size==="number" ? attr.size : 10)*0.4;

	if(S('#'+this.id+'-inner').length==0) S('#'+this.id).append('<div id="'+this.id+'-inner"></div>');
	this.el = S('#'+this.id+'-inner');

	this.options = {
		'showgrid':(typeof attr.grid==="boolean" ? attr.grid : false),
		'showlabel':(typeof attr.showlabel==="boolean" ? attr.showlabel : true),
		'formatLabel': (typeof attr.formatLabel==="function" ? attr.formatLabel : function(txt,attr){ return txt.substr(0,3); }),
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
			if(attr.style[s]['fill']) this.style[s]['fill'] = attr.style[s]['fill'];
			if(attr.style[s]['fill-opacity']) this.style[s]['fill-opacity'] = attr.style[s]['fill-opacity'];
			if(attr.style[s]['font-size']) this.style[s]['font-size'] = attr.style[s]['font-size'];
			if(attr.style[s]['stroke']) this.style[s]['stroke'] = attr.style[s]['stroke'];
			if(attr.style[s]['stroke-width']) this.style[s]['stroke-width'] = attr.style[s]['stroke-width'];
			if(attr.style[s]['stroke-opacity']) this.style[s]['stroke-opacity'] = attr.style[s]['stroke-opacity'];
		}
	}
	
	this.mapping = {};

	// Can load a file or a hexjson data structure
	this.load = function(file,attr,fn){
		if(typeof attr==="function" && !fn){
			fn = attr;
			attr = "";
		}
		if(typeof fn !== "function") return this;

		if(typeof file==="string"){
			S(document).ajax(file,{
				'complete': function(data){
					this.setMapping(data);
					if(typeof fn==="function") fn.call(this,{'data':attr});
				},
				'error': this.failLoad,
				'this': this,
				'dataType':'json'
			});
		}else if(typeof file==="object"){
			this.setMapping(file);
			if(typeof fn==="function") fn.call(this,{'data':attr});
		}
		return this;
	}

	var _obj = this;
	// We'll need to change the sizes when the window changes size
	window.addEventListener('resize', function(event){ _obj.resize(); });
	
	function clone(d){
		return JSON.parse(JSON.stringify(d));
	}

	this.setHexStyle = function(r){
		var h = this.hexes[r];
		var style = clone(this.style['default']);
		var cls = "";

		if(h.active){
			style['fill'] = h.fillcolour;
			//cls += ' active';
		}
		if(h.hover){
			cls += ' hover';
		}
		if(h.selected){
			for(var p in this.style.selected) style[p] = this.style.selected[p];
			cls += ' selected';
		}
		if(this.search.active) cls += (h.highlight) ? ' highlighted' : ' not-highlighted';
		style['class'] = 'hex-cell'+cls;
		h.attr(style);

		this.labels[r].attr({'class':'hex-label'+cls});

		return h;
	}
	
	this.toFront = function(r){
		// Simulate a change of z-index by moving elements to the end of the SVG
		
		// Keep selected items on top
		for(var region in this.hexes){
			if(this.hexes[region].selected){
				this.paper.paper[0].appendChild(this.hexes[region].el[0]);
				this.paper.paper[0].appendChild(this.labels[region].el[0]);
			}
		}
		// Simulate a change of z-index by moving this element (hex and label) to the end of the SVG
		this.paper.paper[0].appendChild(this.hexes[r].el[0]);
		this.paper.paper[0].appendChild(this.labels[r].el[0]);
		return this;
	}

	this.regionToggleSelected = function(r,others){
		this.selected = (this.selected==r) ? "" : r;
		h = this.hexes[r];
		h.selected = !h.selected;
		this.setHexStyle(r);

		// If we've deselected a region, deselect any other regions selected
		if(!h.selected){
			if(others){
				for(region in this.hexes){
					if(this.hexes[region].selected){
						this.hexes[region].selected = false;
						this.setHexStyle(region);
					}
				}
			}
		}
		return this;
	}

	this.regionFocus = function(r){
		h = this.hexes[r];
		h.hover = true;
		this.setHexStyle(r);
		this.toFront(r);
		return this;
	}

	this.regionBlur = function(r){
		h = this.hexes[r];
		h.hover = false;
		this.setHexStyle(r);
		return this;
	}

	this.regionActivate = function(r){
		h = this.hexes[r];
		h.active = true;
		this.setHexStyle(r);
	}

	this.regionDeactivate = function(r){
		h = this.hexes[r];
		h.active = false;
		this.setHexStyle(r);
	}

	this.regionToggleActive = function(r){
		h = this.hexes[r];
		h.active = !h.active;
		this.setHexStyle(r);
	}

	this.selectRegion = function(r){
		this.selected = r;
		for(region in this.hexes){
			h = this.hexes[region];
			if(r.length > 0 && region.indexOf(r)==0){
				h.selected = true;
				this.setHexStyle(region);
			}else{
				h.selected = false;
				this.setHexStyle(region);
			}
		}
		return this;
	}

	// Add events (mouseover, mouseout, click)	
	this.on = function(type,attr,fn){
		if(typeof attr==="function" && !fn){
			fn = attr;
			attr = "";
		}
		if(typeof fn !== "function") return this;
		if(!this.callback) this.callback = {};
		this.callback[type] = { 'fn': fn, 'attr': attr };
		return this;
	}

	// Move the selected hex to the new coordinates
	this.moveTo = function(q,r){
		if(this.selected){
			dq = q - this.mapping.hexes[this.selected].q;
			dr = r - this.mapping.hexes[this.selected].r;

			for(region in this.hexes){
				if(region.indexOf(this.selected)==0){
					this.hexes[region].selected = true;
				}
				if(this.hexes[region].selected){
					this.mapping.hexes[region].q += dq;
					this.mapping.hexes[region].r += dr;
					var h = this.drawHex(this.mapping.hexes[region].q,this.mapping.hexes[region].r);
					this.hexes[region].attr({'path':h.path}).update();
					if(this.options.showlabel && this.labels[region]){
						this.labels[region].attr({'x':h.x,'y':h.y+this.style['default']['font-size']/2,'clip-path':'hex-clip-'+this.mapping.hexes[region].q+'-'+this.mapping.hexes[region].r}).update();
					}
					this.hexes[region].selected = false;
					this.setHexStyle(region);
				}
			}
			this.selected = "";
		}
	}

	this.size = function(w,h){
		this.el.css({'height':'','width':''});
		w = Math.min(this.w,S('#'+this.id)[0].offsetWidth);
		this.el.css({'height':(w/this.aspectratio)+'px','width':w+'px'});
		this.paper = new SVG(this.id+'-inner',this.maxw,this.maxh);
		w = this.paper.w;
		h = this.paper.h;
		scale = w/this.w;
		this.properties.size = this.s*scale;
		this.w = w;
		this.h = h;
		this.transform = {'type':'scale','props':{x:w,y:h,cx:w,cy:h,r:w,'stroke-width':w}};
		this.el.css({'height':'','width':''});


		return this;
	}
	
	function Search(attr){

		if(!attr) attr = {};
		this.attr = attr;
		this.el = '';
		this.active = false;
		this.selected = -1;

		this.init = function(){

			if(this.attr.id) this.el = S('#'+this.attr.id);

			if(this.el.length == 0){
				S('#'+hexmap.id).append('<div class="hex-search"></div>');
				this.el = S('#'+_obj.id+' .hex-search');
			}

			if(this.el.find('.search-input').length==0) this.el.append('<input type="text" class="search-input" name="constituencies" id="constituencies" value="">');
			if(this.el.find('.search-button').length==0) this.el.append('<button class="search-button"></button>');

			this.el.find('.search-button').on('click',{hexmap:_obj,me:this},function(e){
				e.data.me.selected = -1;
				e.data.me.toggle();
			});
			this.el.find('.search-input').on('keyup',{hexmap:_obj,me:this},function(e){
				var value = e.currentTarget.value.toLowerCase();
				var regions = {};
				var li = "";
				var n = 0;
				if(value.length > 1){
					for(var region in e.data.hexmap.hexes){
						if(e.data.hexmap.hexes[region].attributes.title.toLowerCase().indexOf(value)>=0){
							regions[region] = true;
							if(n < 8){
								li += '<li><a href="#" data="'+region+'">'+e.data.hexmap.hexes[region].attributes.title+'</a></li>';
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
					e.data.me.el.find('.search-results a').removeClass('selected')
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
		}
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
		}

		this.highlight = function(rs){
			this.n = 0;
			for(var region in rs) this.n++;
			
			for(var region in _obj.hexes){
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
		}

		this.init();

		return this;
	}

	this.resize = function(){
		return this;
	}

	this.initialized = function(){
		this.create().draw();
		S('.spinner').remove();
		return this;
	}

	this.create = function(){
		this.paper.clear();
		this.constructed = false;
		return this;
	}

/*
	this.autoscale = function(){
		var min = 1e100;
		var max = -1e100;
		for(var region in this.mapping.hexes){
			if(typeof this.values[region]==="number"){
				if(this.values[region] < min) min = this.values[region];
				if(this.values[region] > max) max = this.values[region];
			}
		}
		this.min = min;
		this.max = max;
		return this;
	}
*/
	this.setMapping = function(mapping){
		this.mapping = mapping;
		if(!this.properties) this.properties = { "x": 100, "y": 100 };
		this.properties.x = this.w/2;
		this.properties.y = this.h/2;
		this.setSize();
		var p = mapping.layout.split("-");
		this.properties.shift = p[0];
		this.properties.orientation = p[1];

		return this.initialized();
	}

	this.setSize = function(size){
		if(size) this.properties.size = size;
		this.properties.s = { 'cos': this.properties.size*Math.sqrt(3)/2, 'sin': this.properties.size*0.5 };
		this.properties.s.c = this.properties.s.cos.toFixed(2);
		this.properties.s.s = this.properties.s.sin.toFixed(2);
		return this;
	}

	this.drawHex = function(q,r,scale){
		if(this.properties){
			if(typeof scale!=="number") scale = 1;
			scale = Math.sqrt(scale);

			var x = this.properties.x + (q * this.properties.s.cos * 2);
			var y = this.properties.y - (r * this.properties.s.sin * 3);

			if(this.properties.orientation == "r"){
				if(this.properties.shift=="odd" && (r&1) == 1) x += this.properties.s.cos;
				if(this.properties.shift=="even" && (r&1) == 0) x += this.properties.s.cos;
			}
			if(this.properties.orientation == "q"){
				if(this.properties.shift=="odd" && ((q&1) == 1)) y += this.properties.s.cos;
				if(this.properties.shift=="even" && ((q&1) == 0)) y += this.properties.s.cos;
			}

			var path = [['M',[x,y]]];
			var cs = this.properties.s.c * scale;
			var ss = this.properties.s.s * scale;
			if(this.properties.orientation == "r"){
				// Pointy topped
				path.push(['m',[cs,-ss]]);
				path.push(['l',[-cs,-ss,-cs,ss,0,(this.properties.size*scale).toFixed(2),cs,ss,cs,-ss]]);
				path.push(['z',[]]);
			}else{
				// Flat topped
				path.push(['m',[-ss,cs]]);
				path.push(['l',[-ss,-cs,ss,cs,(this.properties.size*scale).toFixed(2),0,ss,cs,-ss,cs]]);
				path.push(['z',[]]);
			}
			return { 'path':path, 'x':x, 'y': y };
		}
		return this;
	}

	this.updateColours = function(){
		var fn = (typeof this.setColours==="function") ? this.setColours : function(){ return this.style['default'].fill; };
		for(region in this.mapping.hexes){
			this.hexes[region].fillcolour = fn.call(this,region);
			this.setHexStyle(region);
		}

		return this;
	}
	
	this.draw = function(){

		var r,q;
		var h,p;

		var range = { 'r': {'min':1e100,'max':-1e100}, 'q': {'min':1e100,'max':-1e100} };
		for(region in this.mapping.hexes){
			q = this.mapping.hexes[region].q;
			r = this.mapping.hexes[region].r;
			if(q > range.q.max) range.q.max = q;
			if(q < range.q.min) range.q.min = q;
			if(r > range.r.max) range.r.max = r;
			if(r < range.r.min) range.r.min = r;
		}
		
		// Add padding to range
		range.q.min -= this.padding;
		range.q.max += this.padding;
		range.r.min -= this.padding;
		range.r.max += this.padding;
	
		// q,r coordinate of the centre of the range
		qp = (range.q.max+range.q.min)/2;
		rp = (range.r.max+range.r.min)/2;
		
		this.properties.x = (this.w/2) - (this.properties.s.cos * 2 *qp);
		this.properties.y = (this.h/2) + (this.properties.s.sin * 3 *rp);
		
		// Store this for use elsewhere
		this.range = range;
		
		var events = {
			'mouseover': function(e){
				var t = 'mouseover';
				if(e.data.hexmap.callback[t]){
					for(var a in e.data.hexmap.callback[t].attr) e.data[a] = e.data.hexmap.callback[t].attr[a];
					if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(this,e);
				}
			},
			'mouseout': function(e){
				var t = 'mouseout';
				if(e.data.hexmap.callback[t]){
					for(var a in e.data.hexmap.callback[t].attr) e.data[a] = e.data.hexmap.callback[t].attr[a];
					if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(this,e);
				}
			},
			'click': function(e){
				var t = 'click';
				if(e.data.hexmap.callback[t]){
					for(var a in e.data.hexmap.callback[t].attr) e.data[a] = e.data.hexmap.callback[t].attr[a];
					if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(this,e);
				}
			}
			
		}
		
		if(this.options.showgrid){
			this.grid = new Array();
		
			for(q = range.q.min; q <= range.q.max; q++){
				for(r = range.r.min; r <= range.r.max; r++){
					h = this.drawHex(q,r);
					this.grid.push(this.paper.path(h.path).attr({'class':'hex-grid','data-q':q,'data-r':r,'fill':(this.style['grid']['fill']||''),'fill-opacity':(this.style['grid']['fill-opacity']||0.1),'stroke':(this.style['grid']['stroke']||'#aaa'),'stroke-opacity':(this.style['grid']['stroke-opacity']||0.2)}));
					this.grid[this.grid.length-1].on('mouseover',{type:'grid',hexmap:this,data:{'r':r,'q':q}},events.mouseover)
						.on('mouseout',{type:'grid',hexmap:this,me:_obj,data:{'r':r,'q':q}},events.mouseout)
						.on('click',{type:'grid',hexmap:this,region:region,me:_obj,data:{'r':r,'q':q}},events.click);
						
					// Make all the clipping areas
					this.paper.clip({'path':h.path,'type':'path'}).attr({'id':'hex-clip-'+q+'-'+r});
				}
			}
		}

		var min = 50000;
		var max = 80000;
		this.values = {};

		for(region in this.mapping.hexes){
			
			this.values[region] = (this.mapping.hexes[region].p - min)/(max-min);
			if(this.values[region].value < 0) this.values[region] = 0;
			if(this.values[region].value > 1) this.values[region] = 1;

			var h = this.drawHex(this.mapping.hexes[region].q,this.mapping.hexes[region].r);
			
			if(!this.constructed){
				this.hexes[region] = this.paper.path(h.path).attr({'class':'hex-cell','data-q':this.mapping.hexes[region].q,'data-r':this.mapping.hexes[region].r});
				this.hexes[region].selected = false;
				this.hexes[region].active = true;
				this.hexes[region].attr({'id':'hex-'+region});

				// Attach events
				this.hexes[region].on('mouseover',{type:'hex',hexmap:this,region:region,data:this.mapping.hexes[region],pop:this.mapping.hexes[region].p},events.mouseover)
					.on('mouseout',{type:'hex',hexmap:this,region:region,me:this.hexes[region]},events.mouseout)
					.on('click',{type:'hex',hexmap:this,region:region,me:this.hexes[region],data:this.mapping.hexes[region]},events.click);


				if(this.options.showlabel){
					if(!this.labels) this.labels = {};
					if(this.style['default']['font-size'] > this.options.minFontSize){
						this.labels[region] = this.paper.text(h.x,h.y+this.style['default']['font-size']/2,this.options.formatLabel(this.mapping.hexes[region].n,{'size':this.properties.size,'font-size':this.style['default']['font-size']})).attr({'clip-path':'hex-clip-'+this.mapping.hexes[region].q+'-'+this.mapping.hexes[region].r,'data-q':this.mapping.hexes[region].q,'data-r':this.mapping.hexes[region].r,'class':'hex-label','text-anchor':'middle','font-size':this.style['default']['font-size']+'px','title':(this.mapping.hexes[region].n || region)});
						this.labels[region].attr({'id':'hex-'+region+'-label'});
						//this.paper.clip({'path':h.path,'type':'path'}).attr({'id':'hex-'+region+'-clip'});
					}
				}

				// Attach events
				this.labels[region].on('mouseover',{type:'hex',hexmap:this,region:region,data:this.mapping.hexes[region],pop:this.mapping.hexes[region].p},events.mouseover)
					.on('mouseout',{type:'hex',hexmap:this,region:region,me:this.labels[region]},events.mouseout)
					.on('click',{type:'hex',hexmap:this,region:region,me:this.labels[region],data:this.mapping.hexes[region]},events.click);

			}
			this.setHexStyle(region);
			this.hexes[region].attr({'stroke':this.style['default'].stroke,'stroke-opacity':this.style['default']['stroke-opacity'],'stroke-width':this.style['default']['stroke-width'],'title':this.mapping.hexes[region].n,'data-regions':region,'style':'cursor: pointer;'});
			//this.hexes[region].attr({'fill-opacity':this.style.selected['fill-opacity'],'fill':(this.hexes[region].selected ? this.style.selected.fill||this.hexes[region].fillcolour : this.style.default.fill),'stroke':'#ffffff','stroke-width':1.5,'title':this.mapping.hexes[region].n,'data-regions':region,'style':'cursor: pointer;'});
			this.hexes[region].update();
		}

		if(!this.constructed) this.paper.draw();

		this.constructed = true;

		return this;
	}
	
	S(document).on('keypress',{me:this},function(e){
		e.stopPropagation();
		if(e.originalEvent.charCode==99) e.data.me.selectBySameColour(e);		// C
	});
		

	this.selectBySameColour = function(){
		if(this.selected){
			for(region in this.hexes){
				if(this.hexes[region].fillcolour==this.hexes[this.selected].fillcolour){
					this.hexes[region].selected = true;
					this.setHexStyle(region);
					//this.hexes[region].attr({'fill':this.style.selected.fill||this.hexes[region].fillcolour,'fill-opacity':this.style.selected['fill-opacity']});
				}
			}
		}
		return this;
	}
		
	this.size();
	if(attr.file) this.load(attr.file);
	
	
	this.search = new Search(attr.search);


	return this;
}


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
	 * @param   Number  r       The red color value
	 * @param   Number  g       The green color value
	 * @param   Number  b       The blue color value
	 * @return  Array           The HSV representation
	 */
	function rgb2hsv(r, g, b){
		r = r/255, g = g/255, b = b/255;
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
	this.text = (this.rgb[0] + this.rgb[1] + this.rgb[2] > 500 || sat > 1) ? "black" : "white";
	return this;
}

