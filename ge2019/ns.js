function ResultsMap(id,attr){
	if(!attr) attr = {};
	if(!attr.padding) attr.padding = 0;
	if(!attr.width || !attr.height || !attr.file || !attr.views) return {};

	this.w = attr.width;
	this.h = attr.height;
	this.aspectratio = attr.width/attr.height;
	this.id = id;
	this.type = "";
	this.files = {};
	this.views = attr.views;

	if(S('#data-selector').length > 0) this.type = S('#data-selector')[0].value;
	if(S('.view-toggle').length > 0) this.type = document.querySelector('input[name="view"]:checked').id;

	this.defaulttype = this.type;

	// Use the search string to pick a parameter to display
	var t = location.search.replace(/\?/,"");
	if(t){
		// Check if this is in the list
		var options = S('#data-selector option');
		if(options.length > 0){
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
		}else{
			// Check if this is in the list
			var options = S('.view-toggle');

			if(options.length > 0){
				var v = "";
				for(var i = 0; i < options.length; i++){
					if(options[i].getAttribute('id')==t){
						options[i].checked = true;
						this.type = t;
					}
				}
			}
		}
	}


	// Create a hex map
	attrhex = JSON.parse(JSON.stringify(attr));
	attrhex.id = id;
	attrhex.size = 16;

	this.hex = new HexMap(attrhex);

	// Do we update the address bar?
	this.pushstate = !!(window.history && history.pushState);

	// Add "back" button functionality
	var _obj = this;
	if(this.pushstate){
		window[(this.pushstate) ? 'onpopstate' : 'onhashchange'] = function(e){
			if(e.state && e.state.type) _obj.updateData(e.state.type);
			else _obj.updateData(_obj.defaulttype)
		};
	}

	this.hex.load(attr.file,{me:this},function(e){
		e.data.me.setType(e.data.me.type,true);
	});
	
	this.setType = function(t,firstUpdate){

		// Have we changed type?
		if(t==this.by){
			console.log('no change');
			return this;
		}

		// Update the history
		if(this.pushstate) history.pushState({type:t},"Hexes",(firstUpdate ? '' : '?'+t));

		this.updateData(t);

		return this;
	}

	this.startPolling = function(type){
		// Poll this data on an interval
		if(this.views[type].live){
			console.info('Start loop for '+type)
			_obj = this;
			this.polling = window.setInterval(function(){
				_obj.loadResults(type,function(type){
					// Set the colours of the map
					this.setColours(attr.type);
				});
			},60000);
		}else{
			if(this.polling){
				console.info('Stop loop');
				clearInterval(this.polling);
			}
		}
	}

	this.updateData = function(type){

		if(this.polling){
			console.info('Stop loop');
			clearInterval(this.polling);
		}

		if(!this.data || !this.data[type]){
			return this.loadResults(type,function(type){
				// Set the colours of the map
				this.setColours(type);
				// Start polling for updates
				if(this.views[type].live) this.startPolling(type);
			});
		}

		// Set the colours
		this.setColours(type);
		
		// Start polling for updates
		if(this.views[type].live) this.startPolling(type);
		
		return this;
	}

	function getLabel(e,title){
		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		
		var view = e.data.builder.views[e.data.builder.by];
		if(view.popup && typeof view.popup.render==="function"){
			return view.popup.render.call(e.data.builder,title,e.data.region);
		}else{
			return {'label':title,'class':cls};
		}
	}

	// Add events to map
	this.hex.on('mouseover',function(e){

		e.data.hexmap.regionFocus(e.data.region);

	}).on('mouseout',{'builder':this},function(e){

		e.data.hexmap.regionBlur(e.data.region);

	}).on('click',{'builder':this},function(e){

		var previous = e.data.hexmap.selected;
		var current = e.data.region;
		if(e.data.hexmap.search.active) e.data.hexmap.search.toggle();
		if(previous && current == previous) e.data.hexmap.regionToggleSelected(previous,true);
		else e.data.hexmap.selectRegion(e.data.region);
		if(!e.data.hexmap.selected) S('.infobubble').remove();
		else e.data.builder.label(e,this.attr('title'));

	});

	this.label = function(e,title){
		l = getLabel(e,title);
		if(S('.infobubble').length == 0) S('#'+this.id+'').after('<div class="infobubble"><div class="infobubble_inner"></div></div>');
		S('.infobubble_inner').html(l.label).css({'width':(l.w ? l.w+'px':''),'height':(l.h ? l.h+'px':'')});
		S('.infobubble').attr('class','infobubble'+(l['class'] ? ' '+l['class'] : ''));
		return this;
	}

	// Add events to select options for colour changing
	S('#data-selector').on('change',{me:this},function(e){
		e.data.me.setType(e.currentTarget.selectedOptions[0].getAttribute('value'));
		S(e.currentTarget).removeClass('c10-bg').addClass('b5-bg');
		S(e.currentTarget.selectedOptions[0]).addClass('c10-bg').removeClass('b5-bg');
	});
	// Add events to buttons for colour changing
	S('.view-toggle').on('change',{me:this},function(e){
		e.data.me.setType(document.querySelector('input[name="view"]:checked').id);
	});


	// Make save functions
	if(typeof Blob==="function"){
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

	this.loadResults = function(type,callback){
		if(!type) type = "GE2015-results";

		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};

		if(this.views[type]){
			console.info('Getting '+this.views[type].file);
			S().ajax(this.views[type].file,{
				'this': this,
				'callback': callback,
				'dataType':(this.views[type].file.indexOf(".json") > 0 ? 'json':'text'),
				'type': type,
				'cache': (typeof this.views[type].live==="boolean" ? !this.views[type].live : true),
				'process': this.views[type].process,
				'success': function(d,attr){
					// Convert to JSON if CSV
					if(attr.dataType=="text") d = CSV2JSON(d);
					// Process the data
					attr.process.call(this,attr.type,d);
					if(typeof attr.callback==="function") attr.callback.call(this,attr.type);
				},
				'error': function(e,attr){
					console.error('Unable to load '+attr.url);
				}
			});
			
		}
		return this;
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
		
		if(S('#data-selector').length > 0) S('#data-selector')[0].value = type;
		if(S('.view-toggle').length > 0){
			var options = S('.view-toggle');
			for(var i = 0; i < options.length; i++){
				if(options[i].getAttribute('id')==type) options[i].checked = true;
			}
		}

		this.by = type;

		var key = "";

		// Set the function for changing the colours and creating the key
		if(this.views[type] && typeof this.views[type].key==="function") key = this.views[type].key.call(this);
		
		// Update the key
		S('#key').html(key);

		// Update the map colours
		this.hex.updateColours();

		return this;
	}


	function CSV2JSON(data,format,start,end){

		if(typeof start!=="number") start = 1;
		var delim = ",";

		var lines = CSVToArray(data);
		if(typeof end!=="number") end = lines.length;

		var header = lines[0];
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
			line = lines[i];
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
	
	return this;

}
