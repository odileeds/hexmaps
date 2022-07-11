
function Hexify(el){
	
	this.el = S('#'+el);
	w = this.el[0].offsetWidth;
	h = this.el[0].offsetHeight;
	
	var width, height, canvas, context;
	
	this.el.css({'width':w+'px','height':h+'px'});
	var mid = {'x': w/2,'y':h/2};
	var USE_GRID = false;
	var GRID_SIZE = 10;
	var GRID_TYPE = "HEXA";
	
	
	
	function dropOver(evt){
		evt.stopPropagation();
		evt.preventDefault();
		S(this).addClass('drop');
	}
	function dragOff(){ S('.drop').removeClass('drop'); }


	// Setup the dnd listeners.
	var dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', dropOver, false);
	dropZone.addEventListener('dragout', dragOff, false);


	var _obj = this;
	document.getElementById('standard_files').addEventListener('change', function(evt){
		return _obj.handleFileSelect(evt);
	}, false);
	document.getElementById('colour-by').addEventListener('change',function(e){
		_obj.updateColours(e.target.value);
	});

	
	
	this.handleFileSelect = function(evt){

		evt.stopPropagation();
		evt.preventDefault();
		dragOff();

		var files;
		if(evt.dataTransfer && evt.dataTransfer.files) files = evt.dataTransfer.files; // FileList object.
		if(!files && evt.target && evt.target.files) files = evt.target.files;

		function niceSize(b){
			if(b > 1e12) return (b/1e12).toFixed(2)+" TB";
			if(b > 1e9) return (b/1e9).toFixed(2)+" GB";
			if(b > 1e6) return (b/1e6).toFixed(2)+" MB";
			if(b > 1e3) return (b/1e3).toFixed(2)+" kB";
			return (b)+" bytes";
		}


		// files is a FileList of File objects. List some properties.
		var output = "";
		for(var i = 0, f; i < files.length; i++) {
			f = files[i];

			this.file = f.name;

			if(this.file.indexOf(".geojson")>=0) typ = "geojson";


			output += '<div><strong>'+ escape(f.name)+ '</strong> - ' + niceSize(f.size) + ', last modified: ' + (f.lastModified ? (new Date(f.lastModified)).toLocaleDateString() : 'n/a') + '</div>';

			var start = 0;
			var stop = f.size - 1;

			var reader = new FileReader();
			var _obj = this;

			// Closure to capture the file information.
			reader.onloadend = function(evt) {
				if (evt.target.readyState == FileReader.DONE) { // DONE == 2
					if(stop > f.size - 1){
						var l = evt.target.result.regexLastIndexOf(/[\n\r]/);
						result = (l > 0) ? evt.target.result.slice(0,l) : evt.target.result;
					}else result = evt.target.result;

					var lines = result.match(/[\n\r]+/g);
					var got = {};

					if(typ == "geojson"){
						_obj.data = JSON.parse(result);
						_obj.loaded();
					}
				}
			};
			
			// Read in the image file as a data URL.
			var blob = f.slice(start,stop+1);
			reader.readAsText(blob);
		}
		S('#drop_zone').append(output).attr('loaded');

		return this;
	}

	// Extra maths
	var G = {};
	G.sum = function(a) { var i, sum; for (i = 0, sum = 0; i < a.length; sum += a[i++]) {}; return sum; };
	if(typeof Array.prototype.max === 'undefined') G.max = function(a) { return Math.max.apply({}, a); };
	else G.max = function(a) { return a.max(); };
	if(typeof Array.prototype.min === 'undefined') G.min = function(a) { return Math.min.apply({}, a); };
	else G.min = function(a) { return a.min(); };
	G.mean = function(a) { return G.sum(a) / a.length; };


	var nodes = [];
	var links = [];
	var coordlinks = {};

	function separation_distance(p1,p2){
		var d2km = 111;
		var correction = Math.cos(p2[1]*Math.PI/180);
		var dx = d2km*correction*(p1[0]-p2[0]);
		var dy = d2km*(p1[1]-p2[1]);
		return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
	}

	this.loaded = function(k,n){

		var max = 0;
		var maxh = 0;
		var d2km = 111; // degrees to km (approx)
		var templinks = {};
		var bounds = {'N':-90,'S':90,'E':-180,'W':180};


		this.primarykey = k;
		this.primaryname = n;

		function centroid(c,f){
			var lats = new Array(c.length);
			var lons = new Array(c.length);

			for(var i = 0; i < c.length; i++){
				lats[i] = c[i][1];
				lons[i] = c[i][0];
				key = c[i][1]+','+c[i][0]
				if(!coordlinks[key]) coordlinks[key] = {};
				coordlinks[key][f] = true;
			}
			return [G.mean(lons),G.mean(lats)];
		}

		// Find all the centroids
		var centroids = new Array(this.data.features.length);
		for(var i = 0; i < this.data.features.length; i++){
			var geo = [];
			if(this.data.features[i].geometry.type=="MultiPolygon"){
				geo = this.data.features[i].geometry.coordinates[0][0];
				centroids[i] = centroid(geo,i);
			}else if(this.data.features[i].geometry.type=="Polygon"){
				geo = this.data.features[i].geometry.coordinates[0];
				centroids[i] = centroid(geo,i);
			}else if(this.data.features[i].geometry.type=="Point"){
				centroids[i] = this.data.features[i].geometry.coordinates;
				bounds.N = Math.max(bounds.N,centroids[i][1]);
				bounds.S = Math.min(bounds.S,centroids[i][1]);
				bounds.E = Math.max(bounds.E,centroids[i][0]);
				bounds.W = Math.min(bounds.W,centroids[i][0]);
				closest = [];
				// Find the distances to other Points
				for(var j = 0; j < this.data.features.length; j++){
					if(this.data.features[i].geometry.type=="Point"){
						closest.push({'d':separation_distance(this.data.features[i].geometry.coordinates,this.data.features[j].geometry.coordinates),'i':i,'j':j});
					}
				}
				// Sort by closest
				closest.sort((a, b) => {
					return a.d - b.d;
				});
				// Keep links to the nearest Points
				for(var k = 0; k < 5; k++){
					if(closest[k].i != closest[k].j){
						a = i;
						b = closest[k].j;
						if(!templinks[a]) templinks[a] = {};
						if(!templinks[b]) templinks[b] = {};
						templinks[a][b] = true;
						templinks[b][a] = true;
					}
				}
			}
			this.data.features[i].centroid = centroids[i];
		}

		centre = centroid(centroids);

		if(links.length==0){
			// Loop over all the coordinates and find links
			for(var k in coordlinks){
				if(Object.keys(coordlinks[k]).length > 1){
					for(var i in coordlinks[k]){
						for(var j in coordlinks[k]){
							if(i!=j){
								a = Math.min(parseInt(i),parseInt(j));
								b = Math.max(parseInt(i),parseInt(j));
								if(!templinks[a]) templinks[a] = {};
								if(!templinks[b]) templinks[b] = {};
								templinks[a][b] = true;
								templinks[b][a] = true;
							}
						}
					}
				}
			}
		}
		for(var a in templinks){
			for(var b in templinks[a]){
				links.push({'source':parseInt(a),'target':parseInt(b)});
			}
		}


		for(var i = 0; i < this.data.features.length; i++){
			c = this.data.features[i].centroid;
			// Work out the distance to the overall centroid in km
			// We need to correct the longitude for the cosine of the latitude
			correction = Math.cos(c[1]*Math.PI/180);
			this.data.features[i].dx = d2km*correction*(centre[0]-c[0]);
			this.data.features[i].dy = d2km*(centre[1]-c[1]);
			this.data.features[i]._distance = Math.sqrt(Math.pow(this.data.features[i].dx,2)+Math.pow(this.data.features[i].dy,2));
			maxh = Math.max(this.data.features[i].dx,this.data.features[i].dy,maxh);
			max = Math.max(this.data.features[i]._distance,max);
		}
		html = "";
		var d = Math.min(w,h);
		for(var i = 0; i < this.data.features.length; i++){
			var str = getColour(this.data.features[i]._distance/max,new Colour('#F9BC26'),new Colour('#722EA5'));
			var col = new Colour(str);
			this.data.features[i].hex = col.hex;
			var dx = (w/2)-(d/2)*(this.data.features[i].dx/maxh);
			var dy = (h/2)+(d/2)*(this.data.features[i].dy/maxh);
			this.data.features[i].x = (w/2)-(d/2)*(this.data.features[i].dx/maxh)*2;
			this.data.features[i].y = (h/2)+(d/2)*(this.data.features[i].dy/maxh)*2;
			
			html += '<div title="'+this.data.features[i].properties.lsoa11cd+'" style="position:absolute;left:'+(dx)+'px;top:'+(dy)+'px;border-radius:100%;width:6px;height:6px;background-color:'+this.data.features[i].hex+'"></div>';
		}
		

		this.el.css({'position':'relative'});
		this.el.html(html);
		
		var props = {};
		for(var i = 0; i < this.data.features.length; i++){
			for(var p in this.data.features[i].properties){
				if(!props[p]) props[p] = 0;
				props[p]++;
			}
		}
		for(var p in props){
			var opt = document.createElement('option');
			opt.setAttribute('value',p);
			opt.innerHTML = p;
			document.getElementById('colour-by').appendChild(opt);
		}
		
		console.log(props)
		this.collapse();
	}

	this.stop = function(){
		this.force.alpha(0).stop();
		for(var i = 0; i < nodes.length; i++){
			nodes[i].vx = 0;
			nodes[i].vy = 0;
		}
		return this;		
	}
	this.gridify = function(){
		
		for(var i = 0; i < this.cells.length; i++) this.cells[i].occupied = null;

		for(var i = 0; i < nodes.length; i++){
			var gridpoint = this.occupyNearest(nodes[i]);
			if(gridpoint){
				nodes[i].x = gridpoint.x;
				nodes[i].y = gridpoint.y;
				nodes[i].i = gridpoint.i;
				nodes[i].j = gridpoint.j;
			}
		}
		
		return this;
	}
	this.draw = function(){
		drawFrame();
		return this;
	}

	this.makeHexJSON = function(){
		var json = "{\n";
		json += "\t\"layout\": \"odd-r\",\n";
		json += "\t\"hexes\": {\n";
		for(var i = 0; i < nodes.length; i++){
			if(i > 0) json += ',\n';
			json += '\t\t"'+(nodes[i].properties[this.primarykey] || i)+'": {"q":'+nodes[i].i+',"r":'+(-nodes[i].j)+',"n":"'+(nodes[i].properties[this.primaryname] || i)+'","colour":"'+nodes[i].hex+'"';
			for(var k in nodes[i].properties){
				json += ",\""+k+"\": \""+nodes[i].properties[k]+"\"";
			}
			json += "}";
		}
		json += "\n\t}\n}\n";
		return json;
	}


	this.save = function(str,file,type){

		// Make hex json

		if(!str) str = "";
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

	this.sqdist = function(a, b) {
		return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
	}

	this.occupyNearest = function(p) {
		var minDist = 1000000;
		var d;
		var candidate = null;
		var ci = null;
		for(var i = 0; i < this.cells.length; i++) {
			if(!this.cells[i].occupied && ( d = this.sqdist(p, this.cells[i])) < minDist) {
				minDist = d;
				candidate = this.cells[i];
				ci = i;
			}
		}
		if(candidate) candidate.occupied = ci;

		return candidate;
	}

	var shade = new Colour('#d73058');
	const randomColor = () => {
		let color = '#';
		for (let i = 0; i < 6; i++){
		  const random = Math.random();
		  const bit = (random * 16) | 0;
		  color += (bit).toString(16);
		};
		return color;
	};
	this.collapse = function(){

		var maxr = 0;
		width = S('#d3')[0].offsetWidth;
		height = S('#d3')[0].offsetHeight;

		var areas = this.data.features;
		
		this.minsep = 1000;
		for(var i = 0; i < areas.length; i++){
			for(var j = 0; j < areas.length; j++){
				if(i != j){
					d = Math.sqrt(Math.pow((areas[i].x-areas[j].x),2)+Math.pow((areas[i].y-areas[j].y),2));
					this.minsep = Math.min(this.minsep,d);
				}
			}
		}
		var scale = Math.max(1.5/this.minsep,1);

		// Fudge factor
		scale *= 0.3;
		
		var xs = [];
		var ys = [];

		console.log(document.getElementById('colour-by').value);
		for(var i = 0; i < areas.length; i++){
			xs.push(areas[i].x);
			ys.push(areas[i].y);
		}
		
		var xo = G.mean(xs);
		var yo = G.mean(ys);

		// Calculate the inital angle from the centre
		for(var i = 0; i < areas.length; i++){
			dx = (areas[i].x-xo);
			dy = (areas[i].y-yo);
			areas[i].angle = Math.atan2(dy,dx)*180/Math.PI;
		}
			
		var _obj = this;
		var c1 = new Colour('#000000');
		var c2 = new Colour('#d73058');
		
		nodes = d3.range(areas.length).map(function(i) {
			return {
				radius: 5,
				properties: areas[i].properties,
				hex: areas[i]['hex'],
				distancecolour: areas[i]['hex'],
				x: areas[i]['x']*scale,
				y: areas[i]['y']*scale,
				theta: areas[i]['angle']
			};
		});
		
		this.cells = [];
		var d = GRID_SIZE;
		var jo = (height / d)/2;
		var io = (width / d)/2;
		
		for(var i = 0; i < width / d; i++) {
			for(var j = 0; j < height / d; j++) {
				// HACK: ^should be a better way to determine number of rows and cols
				var cell;
				switch (GRID_TYPE) {
					case "PLAIN":
						cell = {
							x : i * d,
							y : j * d
						};
						break;
					case "SHIFT_ODD_ROWS":
						cell = {
							x : i * d,
							y : 1.5 * (j * d + (i % 2) * dE * .5)
						};
						break;
					case "HEXA":
						cell = {
							x : (i-io) * d + (j % 2) * d * .5,
							y : (j-jo) * d * .85
						};
						break;
				}
				cell.i = i;
				cell.j = j;
				this.cells.push(cell);
				
			};
		};

			
		this.forcesetup();

		canvas = document.querySelector("canvas");
		canvas.width = width;
		canvas.height = height;
		context = canvas.getContext("2d");
		
		d3.select(canvas);
				
	}
	this.updateColours = function(prop){

		var lookup = {};
		var cat,i,c;

		if(nodes && nodes.length > 0){
			for(i = 0;  i < nodes.length; i++){
				c = nodes[i].distancecolour;

				cat = nodes[i].properties[prop];
				if(cat){
					if(!lookup[cat]) lookup[cat] = randomColor();
					c = lookup[cat];
				}
				nodes[i].hex = c;
			}
			this.draw();
		}
	}
	
	this.forcesetup = function(jiggle){
		if(!jiggle){
			this.force = d3.forceSimulation(nodes)
				.force("center", d3.forceCenter())
				.force("collision", d3.forceCollide()
					.radius(function(d) {
						return d.radius+1
					})
					.strength(1)
					.iterations(4)
				)
				.force('link', d3.forceLink().links(links).distance(GRID_SIZE))
				.force("gravity",d3.forceManyBody().strength(function(d){
					return 0.1;
				}))
				.force("charge",d3.forceManyBody().strength(function(d){
					return -(Math.pow(d.radius, 2) / 100);
				}))
				.on("tick", function(){
					drawFrame();
				})
		}else{
			var _obj = this;
			this.force = d3.forceSimulation(nodes)
				.force("center", d3.forceCenter())
				.force("collision", d3.forceCollide()
					.radius(function(d) {
						return d.radius+1
					})
					.strength(0.6)
					.iterations(4)
				)
				.force('link', d3.forceLink().links(links).distance(10))
				.force("gravity",d3.forceManyBody().strength(function(d){
					return 0.02;
				}))
				.on("tick", function(){
					drawFrame();
					//_obj.gridify();
				})
		}

	}

	this.start = function(jiggle){
		if(this.force) this.force.stop();
		this.forcesetup(jiggle);
		this.force.alpha(1).restart();
	}

	function drawLink(d) {
		if(nodes.length < 700){
			context.moveTo(d.source.x, d.source.y);
			context.lineTo(d.target.x, d.target.y);
		}
	}

	function drawNode(d) {
		context.beginPath();
		context.fillStyle = d.hex;
		r = (d.radius > 1 ? d.radius : 0);
		context.moveTo(d.x + 3, d.y);
		if(d.value){
			context.textBaseline = "middle";
			context.textAlign = "center";
			context.fillText(d.value,d.x,d.y)
		}else{
			context.arc(d.x, d.y, r/2, 0, 2 * Math.PI);
		}
		context.fill();
	}
	
	function drawFrame(){

		context.clearRect(0, 0, width, height);
		context.save();
		context.translate(width / 2, height / 2);

		context.beginPath();
		links.forEach(drawLink);
		context.strokeStyle = "#cccccc";
		context.lineWidth = 0.5;
		context.stroke();

		//context.beginPath();
		nodes.forEach(drawNode);
		//context.fill();
		context.strokeStyle = "#fff";
		context.stroke();

		context.restore();
	}

	
	

	
	function getColour(pc,a,b){
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
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

		c = c.replace(/NaN/g,"0");
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
}
