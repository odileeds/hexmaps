function Builder(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.side = 16;
	this.id = id;

	this.hex = new HexMap({
		'id':id,
		'width':w,
		'height':h,
		'size':this.side,
		'padding':padding,
		'style': {'selected':{'fill-opacity':0.5 },'default':{'fill-opacity':0.5,'fill':'#cccccc'}}
	});

	this.hex.load(file,{me:this},function(e){ e.data.me.setColours("region"); });

	this.hex.on('mouseover',{'builder':this},function(e){
		e.data.builder.label(this.attr('title'));
		this.attr({'fill-opacity':0.8});
	}).on('mouseout',function(e){
		S('.infobubble').remove();
		this.attr({'fill-opacity':0.5});
	}).on('click',{'builder':this},function(e){
		e.data.hexmap.regionToggleSelected(e.data.region,true);
		e.data.builder.label(this.attr('title'));
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
		S(document).on('keypress',{me:this},function(e){
			if(e.originalEvent.charCode==109) S('#savesvg').trigger('click');	// M
			if(e.originalEvent.charCode==104) S('#save').trigger('click');		// H
		});

		// Add event to button
		S('#savesvg').on('click',{me:this},function(e){ e.data.me.saveSVG(); });

	}else{
		S('#save').css({'display':'none'});
		S('#savesvg').css({'display':'none'});
	}

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
		for (var i = 0, f; i < files.length; i++) {
			f = files[i];

			this.file = f.name;

			if(this.file.indexOf(".csv")>=0){
				typ = "csv";
			}
			if(this.file.indexOf(".hexjson")>=0){
				typ = "hexjson";
			}

			output += '<div><strong>'+ escape(f.name)+ '</strong> - ' + niceSize(f.size) + ', last modified: ' + (f.lastModified ? (new Date(f.lastModified)).toLocaleDateString() : 'n/a') + '</div>';

			// DEPRECATED as not reliable // Only process csv files.
			//if(!f.type.match('text/csv')) continue;

			var start = 0;
			var stop = Math.min(100000, f.size - 1);

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

					if(typ == "hexjson"){
						_obj.data = JSON.parse(result);
					}else if(typ == "csv"){
						var cols = result.slice(0,result.indexOf("\n")).split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/);
						var data = _obj.parseCSV(result,{'url':f.name,'cols':cols.length,'rows':lines.length});
						_obj.data = { 'layout': 'odd-r', 'hexes': {} };
						var id = 0;
						if(data.rows > 0){
							for(var j = 0; j < data.rows[0].length; j++){
								if(data.rows[0][j].toLowerCase()=="id") id = j;
							}
						}
						// Create a HexJSON format
						for(var i = 0; i < data.rows.length; i++){
							// Set a default in case it doesn't exist
							_obj.data.hexes[data.rows[i][id]] = { "n": data.rows[i][id] };
							// Set the properties of the hex
							for(var j = 0; j < data.rows[i].length; j++){
								if(data.fields.format[j]=="integer") data.rows[i][j] = parseInt(data.rows[i][j]);
								if(data.fields.format[j]=="float") data.rows[i][j] = parseFloat(data.rows[i][j]);
								if(data.fields.format[j]=="boolean") data.rows[i][j] = (data.rows[i][j].toLowerCase()=="true" ? true : false);
								_obj.data.hexes[data.rows[i][0]][data.fields.name[j]] = data.rows[i][j];
								if(data.fields.name[j].toLowerCase() == "name") _obj.data.hexes[data.rows[i][0]].n = data.rows[i][j];
							}
						}

						got = {};
						// Find out which q,r combinations we have
						for(var region in _obj.data.hexes){
							q = _obj.data.hexes[region].q;
							r = _obj.data.hexes[region].r;
							if(typeof q==="number" && typeof r==="number"){
								if(!got[q]) got[q] = {};
								got[q][r] = true;
							}
						}
						var s = Math.ceil(Math.sqrt(data.rows.length)) + padding*2;
						//s = Math.min(s,Math.floor(_obj.w/(_obj.hex.properties.s.cos * 2))-5);

						// Need to create dummy q, r values if they don't exist
						var q = 0;
						var r = 0;
						for(var region in _obj.data.hexes){
							if(typeof _obj.data.hexes[region].q!=="number" && typeof _obj.data.hexes[region].r!=="number"){
								while(got[q] && got[q][r]){
									q++;
									if(q > s){
										q = 0;
										r+=2;
									}
								}
								if(!got[q]) got[q] = {};
								got[q][r] = true;
								_obj.data.hexes[region].q = q;
								_obj.data.hexes[region].r = r;
							}
						}
					}


					_obj.hex.load(_obj.data,{me:_obj},function(e){ e.data.me.setColours("region"); });

				}
			};
			
			// Read in the image file as a data URL.
			//reader.readAsText(f);
			var blob = f.slice(start,stop+1);
			reader.readAsText(blob);
		}
		S('#drop_zone').append(output).addClass('loaded');

		return this;
	}

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


	function getColour(pc,a,b){
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}

	this.setColours = function(){

		this.hex.setColours = function(region){
			if(this.mapping.hexes[region].colour) return this.mapping.hexes[region].colour;
			if(this.mapping.hexes[region].color) return this.mapping.hexes[region].color;
			var rs = {'YH':'#F9BC26','EM':'#00B6FF','WM':'#E6007C','EA':'#FF6700','SC':'#2254F4','NI':'#722EA5','WA':'#0DBC37','NW':'#1DD3A7','NE':'#D60303','SW':'#178CFF','LO':'#D73058','SE':'#67E767'};
			if(this.mapping.hexes[region].a && rs[this.mapping.hexes[region].a]) return rs[this.mapping.hexes[region].a];
			return '#EF3AAB';
		}
		
		this.hex.updateColours();

		return this;
	}
	
	// Function to parse a CSV file and return a JSON structure
	// Guesses the format of each column based on the data in it.
	function CSV2JSON(data,start,end){

		// If we haven't sent a start row value we assume there is a header row
		if(typeof start!=="number") start = 1;
		// Split by the end of line characters
		if(typeof data==="string") data = data.split(/[\n\r]+/);
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

			// Split the line by commas (but not commas within quotation marks
			line = data[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/);

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

			req.push(empty == 0);

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

	return this;

}