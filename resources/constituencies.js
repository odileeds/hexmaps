function Constituencies(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.id = id;

	this.hex = new HexMap({'id':id,'width':w,'height':h,'size':16,'padding':padding});

	this.hex.load(file,{me:this},function(e){ e.data.me.setColours("region"); });

	function getLabel(e,title){
		var rs = {'SC':'Scotland','NI':'Northern Ireland','WA':'Wales','NE':'North East','NW':'North West','YH':'Yorkshire &amp; Humber','WM':'West Midlands','EM':'East Midlands','EA':'East Anglia','LO':'London','SE':'South East','SW':'South West'};
		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		if(e.data.builder.by == "population") lbl = title+'<br />Population: '+e.data.pop;
		else if(e.data.builder.by == "party") lbl = title+'<br />Party: '+e.data.hexmap.data['2015'][e.data.region];
		else if(e.data.builder.by == "referendum") lbl = title+'<br />Estimated leave vote: '+(e.data.hexmap.data['referendum'][e.data.region] ? Math.round(e.data.hexmap.data['referendum'][e.data.region]*100)+'%':'unknown');
		else if(e.data.builder.by == "candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['candidates'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong><!--<a href="https://candidates.democracyclub.org.uk/person/'+c[i].i+'">-->'+c[i].n+'<!--</a>--></strong> - '+c[i].p;
			}
		}else lbl = title+'<br />Region: '+rs[e.data.hexmap.mapping.hexes[e.data.region].a];
		return lbl;
	}	
	this.hex.on('mouseover',{'builder':this},function(e){
		e.data.builder.label(getLabel(e,this.attr('title')));
		this.attr('fill-opacity',0.75).attr('stroke-width',4.5);
		// Simulate a change of z-index by moving this element to the end of the SVG
		this.parent()[0].appendChild(this[0]);
	}).on('mouseout',function(e){
		S('.infobubble').remove();
		this.attr('fill-opacity',0.5).attr('stroke-width',1.5);
	}).on('click',{'builder':this},function(e){
		if(e.data.builder.by=="candidates"){
			location.href = "https://candidates.democracyclub.org.uk/election/parl.2017-06-08/post/WMC:"+e.data.region+"/";
		}else{
			e.data.hexmap.regionToggleSelected(e.data.region,true);
			e.data.builder.label(getLabel(e,this.attr('title')));
		}
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

	function updateClass(btn){
		S('.switchdata').addClass('b5-bg').removeClass('c10-bg');btn.removeClass('b5-bg').addClass('c10-bg');
	}
	// Add events to buttons for colour changing
	S('#colour-pop').on('click',{me:this},function(e){ e.data.me.setColours('population'); updateClass(this); });
	S('#colour-reg').on('click',{me:this},function(e){ e.data.me.setColours('region'); updateClass(this); });
	S('#colour-pty').on('click',{me:this},function(e){ e.data.me.setColours('party'); updateClass(this); });
	S('#colour-ref').on('click',{me:this},function(e){ e.data.me.setColours('referendum'); updateClass(this); });
	S('#colour-can').on('click',{me:this},function(e){ e.data.me.setColours('candidates'); updateClass(this); });

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
		if(!type) type = "2015";

		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};
		if(type == "referendum"){
			S().ajax('data/2016referendum-estimates.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[1];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("referendum");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});
		}else if(type == "candidates"){
			S().ajax('data/2017ge-candidates.json',{
				'complete':function(d){
					this.data[type] = d;
					this.hex.data[type] = this.data[type];
					this.setColours("candidates");
				},
				'this': this,
				'error':function(){},
				'dataType':'json'
			});
		}else{
			S().ajax('data/2015results.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[1];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("party");
				},
				'this': this,
				'error':function(){},
				'dataType':'csv'
			});
		
		}
	}

	function getColour(pc,a,b){
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}

	this.setColours = function(type){
		if(!type) type = "region";
		this.by = type;
		if(type == "party" && (!this.data || !this.data["2015"])) return this.loadResults("2015");
		if(type == "referendum" && (!this.data || !this.data["referendum"])) return this.loadResults("referendum");
		if(type == "candidates" && (!this.data || !this.data["candidates"])) return this.loadResults("candidates");

		// Set the function for changing the colours
		if(type == "population"){
			this.hex.setColours = function(region){
				var b = new Colour('#F9BC26');
				var a = new Colour('#D60303');
				var min = 50000;
				var max = 80000;
				var value = (this.mapping.hexes[region].p - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
		}else if(type == "party"){
			this.hex.setColours = function(region){
				r = this.data["2015"][region];
				var p = {'Con':'#2254F4','Lab':'#D60303','LD':'#F9BC26','SNP':'#FF6700','PC':'#1DD3A7','UKIP':'#722EA5','Green':'#0DBC37','DUP':'#4f4c9a','SDLP':'#fbb675','SF':'#b6c727','UUP':'#EF3AAB','Ind':'#dfdfdf','Spk':'#909090'};
				return (p[r] || '#000');
			}
		}else if(type == "referendum"){
			this.hex.setColours = function(region){
				var b = new Colour('#F9BC26');
				var a = new Colour('#2254F4');
				return getColour(1 - (this.data["referendum"][region]-0.2)/0.6,a,b);
			}
		}else if(type == "candidates"){
			this.hex.setColours = function(region){
				var n = this.data["candidates"][region].length;
				var c = '#2254F4';
				if(n > 1) c = '#178CFF';
				if(n > 2) c = '#00B6FF';
				if(n > 3) c = '#08DEF9';
				if(n > 4) c = '#1DD3A7';
				if(n > 5) c = '#67E767';
				if(n > 6) c = '#F9BC26';
				return c;
			}
		}else if(type == "region"){
			this.hex.setColours = function(region){
				var r = this.mapping.hexes[region].a;
				var rs = {'YH':'#F9BC26','EM':'#00B6FF','WM':'#E6007C','EA':'#FF6700','SC':'#2254F4','NI':'#722EA5','WA':'#0DBC37','NW':'#1DD3A7','NE':'#D60303','SW':'#178CFF','LO':'#D73058','SE':'#67E767'};
				return (rs[r] || this.colour.on);
			}
		}
		
		this.hex.updateColours();

		return this;
	}
	
	return this;

}