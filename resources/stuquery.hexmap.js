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

	this.version = "0.2";
	if(!attr) attr  = {};
	if(S('#'+attr.id).length==0){
		console.log("Can't find the element to draw into (#"+attr.id+")");
		return {};
	}

	this.w = attr.width || 300;
	this.h = attr.height || 150;
	this.aspectratio = this.w/this.h;
	this.id = attr.id;
	this.hexes = {};
	this.min = 0;
	this.max = 1;
	this.padding = (typeof attr.padding==="number" ? attr.padding : 0);
	this.properties = { 'size': (typeof attr.size==="number" ? attr.size : 10) };
	this.options = {
		'showgrid':(typeof attr.grid==="boolean" ? attr.grid : true),
		'showlabel':(typeof attr.showlabel==="boolean" ? attr.showlabel : true),
		'formatLabel': (typeof attr.formatLabel==="function" ? attr.formatLabel : function(txt){ return txt.substr(0,3); })
	};

	this.style = { 'default': { 'fill': '#cccccc','fill-opacity':(this.options.showlabel ? 0.5 : 1) }, 'selected': { 'fill': '#ffffff','fill-opacity':(this.options.showlabel ? 0.8 : 1) } };
	for(var s in attr.style){
		if(attr.style[s]['fill']) this.style[s]['fill'] = attr.style[s]['fill'];
		if(attr.style[s]['fill-opacity']) this.style[s]['fill-opacity'] = attr.style[s]['fill-opacity'];
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
	
	
	// style = none, default, selected
	this.setHexStyle = function(r){
		var h = this.hexes[r];
		if(h.selected) h.attr({'fill': (this.style.selected.fill ? this.style.selected.fill : h.fillcolour), 'fill-opacity': this.style.selected['fill-opacity'] });
		else h.attr({'fill': (h.active ? h.fillcolour : this.style.default.fill), 'fill-opacity': this.style.default['fill-opacity']});

		return h;
	}

	this.regionToggleSelected = function(r,all){
		this.selected = (this.selected==r) ? "" : r;
		h = this.hexes[r];
		h.selected = !h.selected;
		this.setHexStyle(r);

		// If we've deselected a region, deselect any other regions selected
		if(!h.selected){
			if(all){
				for(region in this.hexes){
					if(this.hexes[region].selected){
						this.hexes[region].selected = false;
						this.setHexStyle(region);
					}
				}
			}
		}
console.log(r,h,h.selected)
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
			if(region.indexOf(r)==0){
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
					if(this.options.showlabel) this.labels[region].attr({'x':h.x,'y':h.y+this.properties.fs/2});
					this.hexes[region].selected = false;
					this.setHexStyle(region);
				}
			}
			this.selected = "";
		}
	}

	this.size = function(w,h){
		S('#'+this.id).css({'height':'','width':''});
		w = Math.min(this.w,S('#'+this.id)[0].offsetWidth);
		S('#'+this.id).css({'height':(w/this.aspectratio)+'px','width':w+'px'});
		this.paper = new SVG(this.id);
		w = this.paper.w;
		h = this.paper.h;
		this.transform = {'type':'scale','props':{x:w,y:h,cx:w,cy:h,r:w,'stroke-width':w}};
		
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

		var fn = (typeof this.setColours==="function") ? this.setColours : function(){ return this.style.default.fill; };
		for(region in this.mapping.hexes){
			this.hexes[region].fillcolour = fn.call(this,region);
			this.setHexStyle(region);
		}

		return this;
	}
	
	this.draw = function(){

		var r,q;
		var h,p;
		this.properties.fs = this.properties.size*0.4;

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
		
		if(this.options.showgrid){
			this.grid = new Array();
		
			for(q = range.q.min; q <= range.q.max; q++){
				for(r = range.r.min; r <= range.r.max; r++){
					h = this.drawHex(q,r);
					this.grid.push(this.paper.path(h.path).attr({'fill':this.style['default']['fill']||'','fill-opacity':0.1,'stroke':'#aaa','style':'cursor: pointer;'}));
					this.grid[this.grid.length-1].on('click',{hexmap:this,q:q,r:r},function(e){
						e.data.hexmap.moveTo(e.data.q,e.data.r);
					});
				}
			}
		}

		var min = 50000;
		var max = 80000;
		/*
		for(region in this.mapping.hexes){
			if(this.mapping.hexes[region].p > max) max = this.mapping.hexes[region].p;
			if(this.mapping.hexes[region].p < min) min = this.mapping.hexes[region].p;
		}
		*/
		this.values = {};

		for(region in this.mapping.hexes){
			
			this.values[region] = (this.mapping.hexes[region].p - min)/(max-min);
			if(this.values[region].value < 0) this.values[region] = 0;
			if(this.values[region].value > 1) this.values[region] = 1;

			var h = this.drawHex(this.mapping.hexes[region].q,this.mapping.hexes[region].r);//,this.mapping.hexes[region].value*0.5 + 0.5);
			
			if(!this.constructed){
				if(this.options.showlabel){
					if(!this.labels) this.labels = {};
					this.labels[region] = this.paper.text(h.x,h.y+this.properties.fs/2,this.options.formatLabel(this.mapping.hexes[region].n)).attr({'text-anchor':'middle','font-size':this.properties.fs+'px','title':(this.mapping.hexes[region].n || region)});
				}
				this.hexes[region] = this.paper.path(h.path);
				this.hexes[region].selected = false;
				this.hexes[region].active = true;

				// Attach events
				var _obj = this.hexes[region];
				_obj.id = 'hex-'+region;
				_obj.on('mouseover',{hexmap:this,region:region,pop:this.mapping.hexes[region].p},function(e){
					var t = 'mouseover';
					if(e.data.hexmap.callback[t]){
						for(var a in e.data.hexmap.callback[t].attr) e.data[a] = e.data.hexmap.callback[t].attr[a];
						if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(this,e);
					}
				}).on('mouseout',{hexmap:this,me:_obj},function(e){
					var t = 'mouseout';
					if(e.data.hexmap.callback[t]){
						for(var a in e.data.hexmap.callback[t].attr) e.data[a] = e.data.hexmap.callback[t].attr[a];
						if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(this,e);
					}
				}).on('click',{hexmap:this,region:region,me:_obj},function(e){
					var t = 'click';
					if(e.data.hexmap.callback[t]){
						for(var a in e.data.hexmap.callback[t].attr) e.data[a] = e.data.hexmap.callback[t].attr[a];
						if(typeof e.data.hexmap.callback[t].fn==="function") return e.data.hexmap.callback[t].fn.call(this,e);
					}
				});
			}
			this.setHexStyle(region);
			this.hexes[region].attr({'stroke':'#ffffff','stroke-width':1.5,'title':this.mapping.hexes[region].n,'data-regions':region,'style':'cursor: pointer;'});
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

