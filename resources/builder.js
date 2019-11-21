function HexBuilder(id,attr){

	this.name = "HexBuilder";
	this.version = "1.1";
	this.id = id;
	var side = 16;
	var width = 1088;
	var height = 1220;
	var padding = 2;
	
	
	this.createMap = function(){

		// Get full range of r and q
		var range = {'r':{'min':1e100,'max':-1e100},'q':{'min':1e100,'max':-1e100}};
		for(var h in this.data.hexes){
			range.r.min = Math.min(this.data.hexes[h].r,range.r.min);
			range.q.min = Math.min(this.data.hexes[h].q,range.q.min);
			range.r.max = Math.max(this.data.hexes[h].r,range.r.max);
			range.q.max = Math.max(this.data.hexes[h].q,range.q.max);
		}
		
		dim = Math.max(range.r.max-range.r.min, range.q.max-range.q.min);
		
		width = Math.min(S('#hexmap')[0].clientWidth,1080);
		height = width*(range.r.max-range.r.min)/dim;

		side = width/((dim+3)*1.73205);
		

		this.hex = new HexMap({
			'id':'hexmap',
			'width':width,
			'height':height,
			'size':side,
			'padding':padding,
			'minFontSize': 0,
			'grid': true,
			'style': {
				'selected':{'fill-opacity':0.5, 'fill':'#EF3AAB' },
				'default':{'fill-opacity':0.5,'fill':'#722EA5','font-size':side/4},
				'grid':{'fill-opacity':0.1,'fill':'#ccc'}
			},
			'formatLabel': function(txt,attr){
				return txt.replace(/\s/g,"\n").replace(/\//g,"\/\n");
			}
		});
		
		this.hex.on('mouseover',{'builder':this},function(e){
			if(e.data.type=="hex"){
				e.data.hexmap.regionFocus(e.data.region);
				e.data.builder.label(e.data.data);
			}else if(e.data.type=="grid"){
				if(e.data.hexmap.selected){
					this.attr('fill-opacity',0.5);
				}
			}
		}).on('mouseout',function(e){
			if(e.data.type=="hex"){
				S('.infobubble').remove();
				e.data.hexmap.regionBlur(e.data.region);
			}else if(e.data.type=="grid"){
				if(e.data.hexmap.selected){
					this.attr('fill-opacity',0.1);
				}
			}
		}).on('click',{'builder':this},function(e){
			if(e.data.type=="hex"){
				if(e.data.hexmap.search.active) e.data.hexmap.search.toggle();
				e.data.hexmap.regionToggleSelected(e.data.region,true);
				e.data.builder.label(e.data.data);
			}else if(e.data.type=="grid"){
				if(e.data.hexmap.selected){
					e.data.hexmap.moveTo(e.data.data.q,e.data.data.r);
					this.attr('fill-opacity',0.1);
				}
			}
		});

		return this;
	}

	this.addData = function(){
		
		this.hex.load(file,{me:this},function(e){ e.data.me.setColours("region"); });

	}

	
	this.label = function(data){
		var l = "";
		if(S('.infobubble').length == 0) S('#'+this.id+' svg').after('<div class="infobubble"><div class="infobubble_inner"></div></div>');
		
		if(typeof data==="string") l = data;
		else{
			for(var a in data){
				l += (l ? '<br />':'')+a+': '+data[a];
			}
		}
		S('.infobubble_inner').html(l);
		return this;
	}

	this.saveable = (typeof Blob==="function");

	function dropOver(evt){
		evt.stopPropagation();
		evt.preventDefault();
		S(this).addClass('drop');
	}
	function dragOff(){ S('.drop').removeClass('drop'); }

	this.init = function(){
		S('form').on('reset',{me:this},function(e){
			e.preventDefault();
			e.data.me.reset();
		});
		S('form').on('submit',{me:this},function(e){
			e.preventDefault();
			url = S('#url')[0].value;
			if(e.data.me.file) e.data.me.process();
			else if(!e.data.me.file && url) e.data.me.getFromURL(url,e.data.me.process);
			else e.data.me.message('No data provided. Please make sure you either provide a URL or file.',{'id':'error','type':'ERROR'});
			return this;
		});
		S('#example').on('click',{me:this},function(e){
			e.preventDefault();
			e.data.me.example();
		});


		// Setup the dnd listeners.
		var _obj = this;
		var dropZone = document.getElementById('drop_zone');
		dropZone.addEventListener('dragover', dropOver, false);
		dropZone.addEventListener('dragout', dragOff, false);
		S('#standard_files').on('change',{me:this},function(e){ return e.data.me.handleFileSelect(e.originalEvent); });

		var file = location.search.substr(1,);
		if(file){
			S('#url')[0].value = file;
			S('form').trigger('submit');
		}

		return this;
	}

	this.setup = function(){
		return this;
	}
	
	
	this.reset = function(){
		S('#drop_zone').removeClass('loaded');
		S('#url')[0].value = "";
		S('#drop_zone .helpertext').css({'display':''});
		S('#results').css({'display':''});
		S('#hexmap').html("");
		S('#'+this.id+' .options').removeClass("holder").html("");
		S('#filedetails').remove();
		S('#messages').html('');
		tr = S('table.odi tr');
		if(tr.length > 1){
			for(var i = 1; i < tr.length; i++){
				S(tr[i]).remove();
			}
		}
		S('.part').removeClass('c8-bg').addClass('b5-bg');
		delete this.data;
		delete this.url;
		delete this.file;
		
		this.setup();
		
		return this;
	}
	
	this.example = function(){
		var el = S('#url');
		el[0].value = el.attr('placeholder').replace(/^.*(https?:\/\/[^\s]+).*$/,function(m,p1){ return p1; });
		this.getFromURL(el[0].value,this.process);
		return this;
	}

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

			var got = {};
			var data = this.parseCSV(this.file.contents,{'url':this.file.name});
			this.file.csv = data;
			this.data = { 'layout': 'odd-r', 'hexes': {} };
			var id = 0;
			if(data.rows > 0){
				for(var j = 0; j < data.rows[0].length; j++){
					if(data.rows[0][j].toLowerCase()=="id") id = j;
				}
			}
			// Create a HexJSON format
			for(var i = 0; i < data.rows.length; i++){
				// Set a default in case it doesn't exist
				this.data.hexes[data.rows[i][id]] = { "n": data.rows[i][id] };
				// Set the properties of the hex
				for(var j = 0; j < data.rows[i].length; j++){
					if(data.fields.format[j]=="integer") data.rows[i][j] = parseInt(data.rows[i][j]);
					if(data.fields.format[j]=="float") data.rows[i][j] = parseFloat(data.rows[i][j]);
					if(data.fields.format[j]=="boolean") data.rows[i][j] = (data.rows[i][j].toLowerCase()=="true" ? true : false);
					this.data.hexes[data.rows[i][0]][data.fields.name[j]] = data.rows[i][j];
					if(data.fields.name[j].toLowerCase() == "name") this.data.hexes[data.rows[i][0]].n = data.rows[i][j];
				}
			}

		}else if(this.file.type == "hexjson"){

			if(typeof this.file.contents==="string") this.data = JSON.parse(this.file.contents);
			else this.data = this.file.contents;

		}
		
		got = {};
		var len = 0;
		// Find out which q,r combinations we have
		for(var region in this.data.hexes){
			q = this.data.hexes[region].q;
			r = this.data.hexes[region].r;
			if(typeof q==="number" && typeof r==="number"){
				if(!got[q]) got[q] = {};
				got[q][r] = true;
			}
			len++;
		}
		var s = Math.ceil(Math.sqrt(len)) + padding*2;
		// Do we need to create dummy q, r values?
		var q = 0;
		var r = 0;
		for(var region in this.data.hexes){
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
		}


		this.createMap();
		this.hex.load(this.data,{me:this},function(e){ e.data.me.setColours("region"); });
		S('#'+this.id).find('.options').addClass("holder").css({'text-align':'center'});
		
		// If we can save then we build the save buttons and add events to them
		if(this.saveable){
			S('#'+this.id).find('.options').html('<p><button id="save" class="c10-bg">Save hexes as <span class="line">H</span>exJSON</button> <button id="savesvg" class="c10-bg">Save <span class="line">m</span>ap as SVG</button></p>');
			// Add event to button
			S('#save').on('click',{me:this},function(e){ e.data.me.save(); });
			// Add key binding
			S(document).on('keypress',{me:this},function(e){
				if(e.originalEvent.charCode==109) S('#savesvg').trigger('click');	// M
				if(e.originalEvent.charCode==104) S('#save').trigger('click');		// H
			});

			// Add event to button
			S('#savesvg').on('click',{me:this},function(e){ e.data.me.saveSVG(); });

		}
		
		return this;
	}

	function updateClass(btn){
		S('.switchdata').addClass('b5-bg').removeClass('c10-bg');btn.removeClass('b5-bg').addClass('c10-bg');
	}
	
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

	}

	this.getFromURL = function(url,callback){
		S().ajax(url,{
			'dataType': (url.indexOf('\.hexjson') > 0 ? 'json':'text'),
			'this':this,
			'callback': callback,
			'success':function(result,attr){
				this.message('Loaded '+attr.url,{'id':'load','class':'c5-bg'});
				this.file = { 'name': attr.url, 'contents': result };
				if(typeof attr.callback==="function") attr.callback.call(this);
			},
			'error': function(e,attr){
				this.message('Unable to load '+attr.url,{'id':'load','type':'ERROR'});
			}
		});
		return this;
	}

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
		f = files[0];
		this.file = {'name':f.name};

		// Work out what the file type is
		typ = "";
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
			S('#drop_zone').append(output).addClass('loaded');

		}else{
			this.message('Unable to load '+this.file,{'id':'error','type':'ERROR'});
		}

		return this;
	};


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

	this.log = function(){
		if(this.logging || arguments[0]=="ERROR"){
			var args = Array.prototype.slice.call(arguments, 0);
			if(console && typeof console.log==="function"){
				if(arguments[0] == "ERROR") console.error('%c'+this.name+'%c: '+args[1],'font-weight:bold;','',(args.splice(2).length > 0 ? args.splice(2):""));
				else if(arguments[0] == "WARNING") console.warn('%c'+this.name+'%c: '+args[1],'font-weight:bold;','',(args.splice(2).length > 0 ? args.splice(2):""));
				else console.log('%c'+this.name+'%c: '+args[1],'font-weight:bold;','',(args.splice(2).length > 0 ? args.splice(2):""));
			}
		}
		return this;
	};

	this.message = function(msg,attr){
		if(!attr) attr = {};
		if(!attr.id) attr.id = 'default';
		if(!attr['type']) attr['type'] = 'message';
		if(msg) this.log(attr['type'],msg);
		var css = "b5-bg";
		if(attr['type']=="ERROR") css = "c12-bg";
		if(attr['type']=="WARNING") css = "c14-bg";
		if(attr['class']) css = attr['class'];

		var msgel = S('#messages');
		if(msgel.length == 0){
			S('#scenario').before('<div class="message"></div>');
			msgel = S('.message');
		}
	
		if(!msg){
			if(msgel.length > 0){
				// Remove the specific message container
				if(msgel.find('#'+attr.id).length > 0) msgel.find('#'+attr.id).remove();
				//msgel.find('#'+attr.id).parent().removeClass('padded');
			}
		}else if(msg){
			// Pad the container
			//msgel.parent().addClass('padded');
			// We make a specific message container
			if(msgel.find('#'+attr.id).length==0) msgel.append('<div id="'+attr.id+'"><div class="holder padded"></div></div>');
			msgel = msgel.find('#'+attr.id);
			msgel.attr('class',css).find('.holder').html(msg);
		}

		return this;
	};



	function getColour(pc,a,b){
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}

	this.setColours = function(){
/*
		this.hex.setColours = function(region){
			if(this.mapping.hexes[region].colour) return this.mapping.hexes[region].colour;
			if(this.mapping.hexes[region].color) return this.mapping.hexes[region].color;
			var rs = {'YH':'#F9BC26','EM':'#00B6FF','WM':'#E6007C','EA':'#FF6700','SC':'#2254F4','NI':'#722EA5','WA':'#0DBC37','NW':'#1DD3A7','NE':'#D60303','SW':'#178CFF','LO':'#D73058','SE':'#67E767'};
			if(this.mapping.hexes[region].a && rs[this.mapping.hexes[region].a]) return rs[this.mapping.hexes[region].a];
			return '#EF3AAB';
		}
	*/	
		this.hex.updateColours();

		return this;
	}
	
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
		var newdata = new Array();
		var formats = new Array();
		var req = new Array();

		for(var i = 0, rows = 0 ; i < end; i++){

			// If there is no content on this line we skip it
			if(data[i] == "") continue;

			line = data[i];

			datum = new Array(line.length);
			types = new Array(line.length);

			// Loop over each column in the line
			for(var j=0; j < line.length; j++){

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
		for(var j = 0; j < header.length; j++){
			var count = {};
			var empty = 0;
			for(var i = 0; i < newdata.length; i++){
				if(!newdata[i][j]) empty++;
			}
			for(var i = 0 ; i < formats.length; i++){
				if(!count[formats[i][j]]) count[formats[i][j]] = 0;
				count[formats[i][j]]++;
			}
			var mx = 0;
			var best = "";
			for(var k in count){
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
			if(format[j] == "integer" && count['float'] > 0.1*newdata.length) format[j] = "float";

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

	return this;

}