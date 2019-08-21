/*
	Stuquery SVG Builder
*/
function SVG(id,w,h){
	if(!id) return this;
	this.version = "0.1.4";
	this.canvas = S('#'+id);
	this.w = parseInt(w || this.canvas[0].offsetWidth);
	this.h = parseInt(h || this.canvas[0].offsetHeight);
	this.id = id;
	this.canvas.html('<svg height="'+this.h+'" version="1.1" width="'+this.w+'" viewBox="0 0 '+this.w+' '+this.h+'" xmlns="http://www.w3.org/2000/svg"><desc>Created by stuQuery SVG</desc></svg>');
	this.paper = S(this.canvas.find('svg')[0]);

	// Initialise
	this.nodes = new Array();
	this.clippaths = new Array();
	this.patterns = new Array();
	
	function Path(path){
		this.path = path;
		this.p = path;
		
		if(typeof path==="string"){
			this.path = path;
			this.p = path;
			var c;
			this.p += '0';
			this.p = this.p.match(/(^|[A-Za-z]| )[^ A-Za-z]+/g);
			var a = this.p[this.p.length-1];
			this.p[this.p.length-1] = a.substring(0,a.length-1);
			for(var i = 0; i < this.p.length; i++){
				if(this.p[i].search(/[A-Za-z]/) == 0){
					c = this.p[i][0];
					this.p[i] = this.p[i].substr(1);
				}else{
					if(this.p[i][0] == ' ') this.p[i] = this.p[i].substr(1);
					c = '';
				}
				this.p[i] = [c,this.p[i].split(/\,/)];
				if(this.p[i][1].length == 2){
					for(var j = 0; j < this.p[i][1].length; j++) this.p[i][1][j] = parseFloat(this.p[i][1][j]);
				}else{
					this.p[i][1] = [];
				}
			}
		}else{
			this.p = path;
			this.path = this.string(path);
		}
		return this;
	}
	Path.prototype.string = function(){
		var str = '';
		for(var i = 0; i < this.p.length; i++){
			str += ((this.p[i][0]) ? this.p[i][0] : ' ')+(this.p[i][1].length > 0 ? this.p[i][1].join(',') : ' ');
		}
		return str;
	}
	function copy(o) {
		var out, v, key;
		out = Array.isArray(o) ? [] : {};
		for (key in o) {
			v = o[key];
			out[key] = (typeof v === "object") ? copy(v) : v;
		}
		return out;
	}
	Path.prototype.copy = function(){
		return new Path(copy(this.p));
	}
	function Node(inp){
		this.transforms = [];
		// Make a structure to hold the original properties
		this.orig = {};
		this.events = new Array();
		for(var i in inp) this[i] = inp[i];
		for(var i in inp) this.orig[i] = inp[i];
		if(this.path){
			this.path = new Path(this.path);
			this.d = this.path.string();
			this.orig.path = this.path.copy();
			this.orig.d = this.d;
		}
		return this;
	}
	Node.prototype.on = function(type,attr,fn){
		if(!fn && typeof attr==="function"){
			fn = attr;
			attr = {};
		}
		this.events.push({'type':type,'attr':attr,'fn':fn});
		return this;
	}
	Node.prototype.attr = function(attr,arg){
		if(arg){ attr = {}; attr[attr] = arg; }
		if(!this.attributes) this.attributes = {};
		if(!this.el || this.el.length == 0) this.el = S('#'+this.id);
		for(a in attr){
			if(typeof attr[a]==="string") attr[a] = attr[a].replace(/\"/g,"\'");
			this.attributes[a] = attr[a];
			this.el.attr(a,attr[a]);
		}
		this.orig.attributes = JSON.parse(JSON.stringify(this.attributes));
		return this;
	}
	Node.prototype.transform = function(ts){
		if(typeof ts.length==="undefined" && typeof ts==="object") ts = [ts];
		if(!this.transforms) this.transforms = [];
		for(var t = 0; t < ts.length; t++) this.transforms.push(ts[t]);
		return this;
	}
	Node.prototype.update = function(){
		//console.log('update',this.type,this.transforms)
		if(this.transforms && this.transforms.length > 0){

			// Reset path
			if(this.orig.path) this.path = this.orig.path.copy();
			
			// Loop over all the transforms and update properties
			for(var t = 0; t < this.transforms.length; t++){
				for(var p in this.transforms[t].props){
					// Replace the current value with the original
					if(this.orig[p] && this[p]) this[p] = JSON.parse(JSON.stringify(this.orig[p]));
				}
			}
			// Update attributes to the original ones
			if(this.orig.attributes) this.attributes = JSON.parse(JSON.stringify(this.orig.attributes));

			for(var t = 0; t < this.transforms.length; t++){
				if(this.transforms[t].type=="scale"){
					if(this.type == "path"){
						for(var i = 0; i < this.orig.path.p.length; i++){
							for(var j = 0; j < this.orig.path.p[i][1].length; j++){
								this.path.p[i][1][j] *= this.transforms[t].props[(j%2==0 ? "x": "y")];
							}
						}
						this.path.path = this.path.string();
						this.d = this.path.path;
					}else{
						for(var p in this.transforms[t].props){
							if(this[p]) this[p] *= this.transforms[t].props[p];
						}
					}
					if(this.attributes){
						for(var p in this.transforms[t].props){
							if(this.attributes[p]) this.attributes[p] *= this.transforms[t].props[p];
						}
					}
				}
			}
		}
		return this;
	}
	this.circle = function(x,y,r){
		this.nodes.push(new Node({'cx':x,'cy':y,'r':r,'type':'circle'}));
		return this.nodes[this.nodes.length-1];
	}
	this.rect = function(x,y,w,h,r){
		if(r) this.nodes.push(new Node({'x':x,'y':y,'width':w,'height':h,'r':r,'rx':r,'ry':r,'type':'rect'}));
		else this.nodes.push(new Node({'x':x,'y':y,'width':w,'height':h,'type':'rect'}));
		return this.nodes[this.nodes.length-1];
	}
	this.path = function(path){
		this.nodes.push(new Node({'path':path,'type':'path'}));
		return this.nodes[this.nodes.length-1];
	}
	this.text = function(x,y,text){
		this.nodes.push(new Node({'x':x,'y':y,'type':'text','text':text}));
		return this.nodes[this.nodes.length-1];
	}
	this.clip = function(o){
		this.clippaths.push(new Node(o));
		return this.clippaths[this.clippaths.length-1];
	}
	this.pattern = function(o){
		this.patterns.push(o);
		return this.patterns[this.patterns.length-1];
	}

	return this;
}
SVG.prototype.clear = function(){
	this.nodes = new Array();
	this.clippaths = new Array();
	this.patterns = new Array();
	this.draw();
	return this;
}
SVG.prototype.draw = function(head){
	var dom = "<desc>Created by stuQuery SVG</desc>";
	if(this.patterns.length > 0){
		for(var i = 0; i < this.patterns.length; i++) dom += this.patterns[i];
	}
	if(this.clippaths.length > 0){
		dom += '<defs>';
		for(var i = 0; i < this.clippaths.length; i++){
		
			dom += '<clipPath id="'+this.clippaths[i].id+'">';
			if(this.clippaths[i].type){
				// Update node with any transforms
				this.clippaths[i].update();
				dom += '<'+this.clippaths[i].type;
				// Add properties
				for(var j in this.clippaths[i]){
					if(j != "type" && typeof this.clippaths[i][j]!=="object" && typeof this.clippaths[i][j]!=="function" && j != "attributes"){
						dom += ' '+j+'="'+this.clippaths[i][j]+'"';
					}
				}
				dom += ' />';
			}
			dom += '</clipPath>';
		}
		dom += '</defs>';
	}

	for(var i = 0; i < this.nodes.length; i++){
		var t = this.nodes[i].type;
		var arr = (this.nodes[i].text) ? this.nodes[i].text.split(/\n/) : [];
		if(!this.nodes[i].id) this.nodes[i].id = this.id+'-svg-node-'+i;
		// Set the ID if we've been given one
		if(this.nodes[i].attributes && this.nodes[i].attributes['id']) this.nodes[i].id = this.nodes[i].attributes['id'];

		if(this.nodes[i].type){
			dom += '<'+t;
			// Update node with any transforms
			this.nodes[i].update();
			// Add properties
			for(var j in this.nodes[i]){
				if(j != "type" && typeof this.nodes[i][j]!=="object" && typeof this.nodes[i][j]!=="function" && j != "attributes") dom += ' '+j+'="'+this.nodes[i][j]+'"';
			}
			dom += ' id="'+this.nodes[i].id+'"';
			// Add attributes
			for(var a in this.nodes[i].attributes) dom += ' '+a+'="'+(a == "clip-path" ? 'url(#':'')+this.nodes[i].attributes[a]+(a == "clip-path" ? ')':'')+'"';
			// Draw internal parts of a text elements
			if(this.nodes[i].text){
				var y = 0;
				var lh = 1.2;
				dom += '>';
				var off = -0.5 + arr.length*0.5;
				for(var a = 0; a < arr.length; a++, y+=lh){
					dom += '<tspan'+(a==0 ? ' dy="-'+(lh*off)+'em"':' x="'+this.nodes[i].x+'" dy="'+lh+'em"')+'>'+arr[a]+'</tspan>';
				}
				dom += '</'+t+'>';
			}else dom += ' />';
		}
	}
	this.paper.html(dom);

	// Attach events to DOM
	for(var i = 0; i < this.nodes.length; i++){
		if(this.nodes[i].events){
			for(var e = 0; e < this.nodes[i].events.length; e++){
				S('#'+this.nodes[i].id).on(this.nodes[i].events[e].type,this.nodes[i].events[e].attr,this.nodes[i].events[e].fn);
			}
		}
	}

	return this;
}
