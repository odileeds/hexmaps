/**
	Open Innovations tool for making hex maps
	Version 2
	
	Things to do:
		* search tool to highlight hexes (top left)
		* load layout from CSV/Google Sheet
		* draw boundaries
		* button to switch layout
		* drag on touch screen when over hexagons but none selected
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

	function HexBuilder(opts){
		if(!opts) opts = {};
		var msg = new OI.logger('HexBuilder v2',{el:document.getElementById('messages'),'visible':['info','warning','error'],'fade':60000,'class':'msg'});

		var _obj = this;
		var el = {
			"canvas": opts.canvas||document.getElementById('canvas'),
			"zoom": opts.zoom||document.getElementById('zoom'),
			"main": document.getElementById('main'),
			"head": document.querySelector('header'),
			"foot": document.querySelector('footer'),
			"nav": document.querySelector('nav'),
			"open": document.getElementById('dialog-open'),
			"hexes": document.querySelector('.data-layer .series')
		}

		this.show = {'info':true};
		this.selectedHexes = [];
		this.query = {};

		// Detect capabilities
		this.saveable = (typeof Blob==="function");
		this.touchable = (window.matchMedia("(pointer: coarse)").matches);

		var minz = parseFloat(el.zoom.getAttribute('min'));
		var maxz = parseFloat(el.zoom.getAttribute('max'));
		var dragging = false;
		var draggingselection = false;
		var zooming = false;
		var touches = 0;
		var point = null;
		var prevDiff = -1;
		var timeDown = new Date();
		var clickedHex = null;

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

		this.reset = function(){
			return this;
		};

		this.resize = function(){
			msg.log('resize',this.wide,this.tall);
			return this.updateView();
		};

		this.updateView = function(){
			this.display.updateViewBox();
			if(this.nav){
				// Need to update these
				document.getElementById('btn-save').disabled = !(this.display.hexes.length > 0);
				document.getElementById('btn-labels').disabled = !(this.display.hexes.length > 0);
				document.getElementById('btn-selectall').disabled = !(this.display.hexes.length > 0);
				document.getElementById('btn-deselect').disabled = (this.selectedHexes.length == 0);
				document.getElementById('btn-removeall').disabled = (this.display.hexes.length == 0);
				document.getElementById('btn-removeselect').disabled = (this.selectedHexes.length == 0);
				document.getElementById('btn-colour').style.display = (this.selectedHexes.length==0) ? "none":"";
				document.getElementById('btn-selectcolour').disabled = (this.selectedHexes.length==0);
				document.getElementById('btn-deselectcolour').disabled = (this.selectedHexes.length==0);
				document.getElementById('btn-attract').disabled = (this.selectedHexes.length != 1);
				document.getElementById('btn-repel').disabled = (this.selectedHexes.length != 1);
				document.getElementById('btn-info').disabled = (this.display.hexes.length == 0);
			}
			this.setHeight();
			return this;
		};

		this.updateSelectedColour = function(c){
			document.getElementById('colourpicker-label').style['background-color'] = c;
			document.querySelectorAll('.selected-colour').forEach(function(el){ el.style['background-color'] = c; });
			return this;
		}

		function PinchZoom(e){
			var x,y,x2,y2,dx,dy,dr,c;
			x = [e.touches[0].clientX,e.touches[1].clientX];
			y = [e.touches[0].clientY,e.touches[1].clientY];
			dx = Math.abs(x[0]-x[1]);
			dy = Math.abs(y[0]-y[1]);
			dr = Math.sqrt(dx*dx + dy*dy);
			c = el.main.getBoundingClientRect();
			if(prevDiff > 0) _obj.zoomAround(((x[0]+x[1])/2)-c.x,((y[0]+y[1])/2)-c.y,parseFloat(el.zoom.value)*(prevDiff/dr));
			// Cache the distance for the next touchmove event
			prevDiff = dr;
		}

		function DragMap(e){
			var x,y;
			if(_obj.touchable){
				x = e.touches[0].clientX;
				y = e.touches[0].clientY;
			}else{
				x = e.clientX;
				y = e.clientY;
			}
			if(point){
				_obj.panBy((x-point.x),(y-point.y));
				_obj.updateView();
			}
			point = {'x':x,'y':y};
			if(!_obj.touchable) _obj.updateSelectionBorder();
		}

		this.init = function(){
			msg.log('init');
			if(this.touchable) document.body.classList.add('touchable');

			opts.hex = {
				'on': {
					'touchstart': function(e){
						touches = e.touches.length;
						if(touches==1){
							e.preventDefault();
							e.stopPropagation();
						}
						timeDown = new Date();
						clickedHex = this;
						if(this.isSelected()) _obj.clearInfo();
						else _obj.setHovered(this).setInfo(this);
					},
					'touchmove': function(e){
						if(!zooming && touches==1){
							dragging = true;
							if(_obj.selectedHexes.length > 0 && (clickedHex && clickedHex.isSelected())) draggingselection = true;
							if(draggingselection){
								if(point){
									var c = _obj.display.screenToRQ({'x':e.touches[0].clientX,'y':e.touches[0].clientY});
									_obj.moveTo(c);
									_obj.updateSelectionBorder();
								}
								point = {'x':e.touches[0].clientX,'y':e.touches[0].clientY};
							}
						}
					},
					'touchend': function(e){
						if((new Date() - timeDown) < 500){
							if(!zooming && touches==1){
								if(draggingselection){
									e.preventDefault();
									e.stopPropagation();
								}
								if(!draggingselection){
									if(this.isSelected()){
										_obj.deselectHex(this).updateView();
										this.toBack();
									}else{
										_obj.selectHex(this).updateView();
										this.toFront();
									}
								}
							}
						}
						draggingselection = false;
						dragging = false;
						clickedHex = null;
					},
					'mouseover': function(e){
						if(!dragging){
							e.preventDefault();
							e.stopPropagation();
							_obj.setHovered(this);
							_obj.setInfo(this);
							this.toFront();
						}
					},
					'mousedown': function(e){
						e.preventDefault();
						e.stopPropagation();
						clickedHex = this;
						dragging = true;
						timeDown = new Date();
					},
					'mousemove': function(e){
						if(_obj.selectedHexes.length > 0 && (this && this.isSelected()) && dragging) draggingselection = true;
					},
					'mouseup': function(e){
						e.preventDefault();
						e.stopPropagation();
						if((new Date() - timeDown) < 500){
							if(e.ctrlKey){
								if(this.isSelected()){
									_obj.deselectHex(this).updateView();
									this.toBack();
								}else{
									_obj.selectHex(this).updateView();
									this.toFront();
								}
							}else{
								_obj.deselectAllHexes();
								_obj.selectHex(this).updateView();
								this.toFront();
							}
						}
						dragging = false;
						draggingselection = false;
						clickedHex = null;
					},
					'mouseout':function(e){
						e.preventDefault();
						e.stopPropagation();
						_obj.setHovered();
						if(!this.isSelected()) _obj.clearInfo();
					},
					'contextmenu':function(e){
						if(clickedHex){
							e.preventDefault();
							e.stopPropagation();
						}
					}
				},
				'resize':function(h){ el.foot.style['max-height'] = h+'px'; }
			}

			if(this.query.labels) opts.labels = this.query.labels;
			this.display = new HexDisplay(el.canvas,opts);
			this.display.init();

			this.search = new Search(this,{
				'max':10,
				'render': function(props){ return props.n; }
			});
			this.search.addTo(el.main.querySelector('.oi-left'));

			this.setScale(parseFloat(el.zoom.value));
			window.addEventListener('resize',function(){ _obj.resize(); });

			this.nav = new OI.NavBar(document.getElementById('navigation'),{'id':'mainmenu'});

			// Create main menu items
			this.nav.add({'id':'menu-file','text':'File'});
			this.nav.add({'id':'menu-edit','text':'Edit'});
			this.nav.add({'id':'menu-view','text':'View'});
			this.nav.add({
				'id':'btn-colour',
				'text':'<input type="color" id="colourpicker"><label for="colourpicker" style="text-indent: -9999px;" title="Change colour of selected hexes" id="colourpicker-label">Change colour</label>',
				'on':{
					'init': function(e){
						document.getElementById('colourpicker').addEventListener('change',function(e){
							_obj.updateSelectedColour(e.target.value);
							_obj.setSelectedColour(e.target.value);
						});
					}
				}
			});

			// Add to main menu items
			this.nav.getItem('menu-file').add({
				'id':'btn-open',
				'icon':'<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3m-8.322.12q.322-.119.684-.12h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981z"/></svg>',
				'text':'Open HexJSON',
				'key':'Ctrl + o',
				'on':{
					'init': function(btn,e){
						document.querySelectorAll('.btn-open').forEach(function(el){
							el.addEventListener('click',function(){ _obj.toggleOpenDialog(); });
						});

						document.getElementById('reset').addEventListener('click',function(e){
							document.getElementById('standard_files').value = '';
							_obj.reset();
						});

						// Add callbacks
						document.getElementById('btnSubmit').addEventListener('click',function(e){
							e.preventDefault();
							// Remove any existing warning message
							var el = document.getElementById('no-file');
							if(el) el.remove();
							// If we have a file we read that
							var file = document.getElementById('standard_files').files[0];
							if(file) _obj.readFile(file);
							else{
								// Try to read a URL
								var url = document.getElementById('url').value;
								if(url) _obj.getURL(url);
								else msg.warn('No input HexJSON provided. Please provide a URL or a file.',{'id':'no-file'});
							}
						});

						document.getElementById('url').addEventListener('change',function(e){ _obj.getURL(e.target.value); });
						function dropOver(evt){
							evt.stopPropagation();
							evt.preventDefault();
							dropZone.classList.add('drop');
						}
						function dragOff(){ dropZone.classList.remove('drop'); }
						var dropZone = document.getElementById('drop_zone');
						dropZone.addEventListener('dragover', dropOver, false);
						dropZone.addEventListener('dragout', dragOff, false);
						document.getElementById('standard_files').addEventListener('change',function(e){ dragOff(); _obj.updateFileDetails(); });

						var exs = document.querySelectorAll('a.example');
						for(var i = 0; i < exs.length ; i++){
							exs[i].addEventListener('click',function(e){
								e.preventDefault();
								document.getElementById('url').value = e.target.getAttribute('href');
								document.getElementById('btnSubmit').click();
							});
						}
					},
					'click': function(){ _obj.toggleOpenDialog(); }
				}
			}).add({
				'id':'btn-save',
				'icon': '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"></path><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"></path></svg>',
				'text':'Save HexJSON',
				'key':'Ctrl + s',
				'on':{
					'click': function(){ _obj.saveHexJSON(); }
				}
			});
			
			this.nav.getItem('menu-edit').add({
				'id':'btn-selectcolour',
				'icon':'<div class="selected-colour box" style="background:black;"></div>',
				'text':'Select hexes by colour',
				'key': 'c',
				'on':{
					'click': function(){ _obj.selectBySameColour(); }
				}
			}).add({
				'id':'btn-deselectcolour',
				'icon':'<div class="selected-colour box" style="background:black;"></div>',
				'text':'Deselect by colour',
				'key': 'Shift + c',
				'on':{
					'click': function(){ _obj.deselectBySameColour(); }
				}
			}).add({
				'id':'btn-selectall',
				'text':'Select all',
				'key': 'Ctrl + a',
				'on':{
					'click': function(){ _obj.selectAllHexes(); }
				}
			}).add({
				'id':'btn-deselect',
				'text':'Deselect all',
				'key': 'Ctrl + d',
				'on':{
					'click': function(){ _obj.deselectAllHexes(); }
				}
			}).addSeparator().add({
				'id':'btn-attract',
				'icon':'<div class="selected-colour box" style="background:black;"></div>',
				'text':'Attract by colour',
				'key': 'a',
				'on':{
					'click': function(){ _obj.attract(1); }
				}
			}).add({
				'id':'btn-repel',
				'icon':'<div class="selected-colour box" style="background:black;"></div>',
				'text':'Repel by colour',
				'key': 'z',
				'on':{
					'click': function(){ _obj.attract(-1); }
				}
			}).addSeparator().add({
				'id':'btn-removeselect',
				'text':'Delete selected hexes',
				'key': 'Delete',
				'on':{
					'click': function(){ _obj.removeSelectedHexes(); }
				}
			}).add({
				'id':'btn-removeall',
				'text':'Delete all hexes',
				'key':'Ctrl + delete',
				'on':{
					'click': function(){ _obj.removeAllHexes(); }
				}
			});

			this.nav.getItem('menu-view').add({
				'icon':'<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/><path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/><path d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5" /></svg>',
				'text':'Zoom in',
				'key': '+',
				'on': {
					'click':function(e){
						_obj.zoomIn();
					}
				}
			}).add({
				'icon':'<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/><path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/><path d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5" /></svg>',
				'text':'Zoom out',
				'key': '-',
				'on': {
					'click':function(e){
						_obj.zoomOut();
					}
				}
			}).add({
				'id':'btn-zoomtobbox',
				'icon':'<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/><path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/><path d="M6.5 6.5m2 -2l-1.5 0 0 -1 2.5 0 0 2.5 -1 0zM6.5 6.5m2 2l0 -1.5 1 0 0 2.5 -2.5 0 0 -1zM6.5 6.5m-2 2l1.5 0 0 1 -2.5 0 0 -2.5 1 0zM6.5 6.5m-2 -2l0 1.5 -1 0 0 -2.5 2.5 0 0 1z" /></svg>',
				'text':'Zoom to fit',
				'key':'f',
				'on':{
					'click': function(){ _obj.zoomToBBox(); }
				}
			}).addSeparator().add({
				'id':'btn-labels',
				'text':'Toggle hexagon labels',
				'key':'l',
				'on':{
					'click': function(){ _obj.toggleLabels(); }
				}
			}).add({
				'id':'btn-grid',
				'text':'Toggle grid',
				'key':'g',
				'on':{
					'click': function(){ _obj.toggleGrid(); }
				}
			}).add({
				'id':'btn-info',
				'text':'Toggle hexagon information',
				'key':'i',
				'on':{
					'click': function(){ _obj.toggleInfo(); }
				}
			});

			// Add the zoom controls
			zoom.addEventListener('input',function(e){
				e.preventDefault();
				_obj.zoomAround(null,null,parseFloat(el.zoom.value));
			});
			el.canvas.addEventListener("wheel",function(e){
				e.preventDefault();
				var c = el.main.getBoundingClientRect();
				_obj.zoomAround(e.clientX-c.x,e.clientY-c.y,parseFloat(el.zoom.value)*(e.deltaY > 0 ? 1.25 : 0.8));
			});
			if(this.touchable){
				// Add touch controls
				el.canvas.addEventListener("touchstart",function(e){
					e.preventDefault();
					e.stopPropagation();
					if(!draggingselection){
						touches = e.touches.length;
						zooming = true;
					}
				});
				el.canvas.addEventListener("touchmove",function(e){
					e.preventDefault();
					e.stopPropagation();
					if(!draggingselection){
						if(touches==2) PinchZoom(e);
						else if(touches==1) DragMap(e);
					}
				});
				el.canvas.addEventListener("touchend",function(e){
					if(!draggingselection){
						point = null;
						zooming = false;
						prevDiff = -1;
						_obj.updateSelectionBorder();
					}
				});
			}else{
				// Add the drag controls
				el.canvas.addEventListener("mousedown",function(e){
					e.preventDefault();
					e.stopPropagation();
					if(!draggingselection){
						dragging = true;
						el.canvas.classList.add('dragging');
					}
				});
				el.canvas.addEventListener("mousemove",function(e){
					e.preventDefault();
					e.stopPropagation();
					if(dragging){
						if(draggingselection){
							var c = _obj.display.screenToRQ({'x':e.clientX,'y':e.clientY});
							_obj.moveTo(c);
							_obj.updateSelectionBorder();
						}else DragMap(e);
					}
				});
				el.canvas.addEventListener("mouseup",function(e){
					e.preventDefault();
					e.stopPropagation();
					if(dragging) dragging = false;
					draggingselection = false;
					point = null;
					_obj.updateSelectionBorder();
					el.canvas.classList.remove('dragging')
				});
			}

			// Add key press functionality
			document.addEventListener('keydown',function(e){
				e.stopPropagation();
				e.preventDefault();
				if(e.key=="c"){
					_obj.selectBySameColour();
				}else if(e.key.toLowerCase()=="c" && e.shiftKey){
					_obj.deselectBySameColour();
				}else if(e.key=="a"){
					e.preventDefault();
					if(e.ctrlKey) _obj.selectAllHexes();
					else _obj.attract(1);
				}else if((e.key.toLowerCase()=="a" && e.ctrlKey && e.shiftKey) || (e.key=="d" && e.ctrlKey) || e.key === "Escape"){
					e.preventDefault();
					_obj.deselectAllHexes();
				}else if(e.key=="f"){
					_obj.zoomToBBox();
				}else if(e.key=="g"){
					_obj.toggleGrid();
				}else if(e.key=="i"){
					_obj.toggleInfo();
				}else if(e.key=="l"){
					_obj.toggleLabels();
				}else if(e.key=="o" && e.ctrlKey){
					e.preventDefault();
					_obj.toggleOpenDialog();
				}else if(e.key=="s" && e.ctrlKey){
					e.preventDefault();
					_obj.saveHexJSON();
				}else if(e.key=="z"){
					e.preventDefault();
					_obj.attract(-1);
				}else if(e.key=="+"){
					_obj.zoomIn();
				}else if(e.key=="-"){
					_obj.zoomOut();
				}else if(e.key=="Delete" || e.key=="Backspace"){
					if(e.ctrlKey) _obj.removeAllHexes();
					else _obj.removeSelectedHexes();
				}
			});

			// Create info link
			var info = document.createElement('div');
			info.classList.add('about');
			info.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/></svg>';
			info.addEventListener('click',function(e){ _obj.toggleAbout(); });
			document.querySelector('header').append(info);

			this.toggleAbout();
			this.setHeight();
			this.updateView();

			if(this.query.url) this.getURL(this.query.url);

			return this;
		};

		this.setHovered = function(hex){
			var list = el.canvas.querySelectorAll('.hovered');
			for(var h = 0; h < list.length; h++) list[h].classList.remove('hovered');
			if(hex) hex.getDom().classList.add('hovered');
			return this;
		};

		this.panBy = function(dx,dy){
			this.display.panBy(dx,dy);
			return this;
		};

		this.toggleGrid = function(){
			this.display.toggleGrid();
			this.updateView();
			return this;
		};

		this.toggleLabels = function(){
			this.display.toggleLabels();
			this.updateView();
			return this;
		}

		this.setHeight = function(){
			var h = window.innerHeight - el.head.offsetHeight - el.nav.offsetHeight;
			this.display.setHeight(h);
			return this;
		};

		this.attract = function(delta){
			if(typeof delta!=="number") delta = -1;
			delta *= -1;
			// Only do something if we have one hex selected
			if(this.selectedHexes.length != 1){
				msg.error('A single hexagon must be selected to attract/repel others of the same colour.');
				return this;
			}

			// Each selected hex is a centre of mass
			// Find the blobs of hexes
			var com = this.selectedHexes[0];
			var colour = com.getColour();

			// Get all the hexes of the same colour
			var h,hexes = [com],islandlookup = {},lookup = {};
			for(h = 0; h < this.display.hexes.length; h++){
				if(this.display.hexes[h].getColour()==colour && this.display.hexes[h].hex!==com) hexes.push(this.display.hexes[h]);
				islandlookup[this.display.hexes[h].hex.id] = -1;
			}
			var id,island,islands = [],neighbours,n,i,hex,dq,dr,ok;
			// Find islands of hexes
			for(h = 0; h < hexes.length; h++){
				id = hexes[h].hex.id;
				island = islandlookup[id];
				if(island < 0){
					// No island set yet
					// See if any of the neighbours have the island set
					neighbours = hexes[h].hex.neighbours(this.display.layout);
					for(n = 0; n < neighbours.length; n++){
						if(neighbours[n].id in islandlookup && islandlookup[neighbours[n].id] >= 0){
							island = islandlookup[neighbours[n].id];
						}
					}
					if(island >= 0){
						islandlookup[id] = island;
					}else{
						islandlookup[id] = islands.length;
						dq = delta*(hexes[h].hex.q-com.hex.q);
						dr = delta*(hexes[h].hex.r-com.hex.r);
						mx = Math.max(Math.abs(dq),Math.abs(dr));
						// Normalise to a change of 1
						dq = Math.round(dq/mx);
						dr = Math.round(dr/mx);
						islands.push({'dq':dq,'dr':dr,'hexes':[]});
					}
					islands[islandlookup[id]].hexes.push(hexes[h]);
				}
			}
			// At this point we have an array of islands where each island is an array of hex IDs

			// For each island (except for the selected island)
			for(i = 1; i < islands.length; i++){
				// Find all the new hex IDs
				shifted = [];

				// Build a new lookup that is every hex ID except those on this island
				lookup = {};
				for(h = 0; h < this.display.hexes.length; h++){
					ok = true;
					for(n = 0; n < islands[i].hexes.length; n++){
						if(islands[i].hexes[n].hex==this.display.hexes[h].hex){
							ok = false;
						}
					}
					if(ok) lookup[this.display.hexes[h].hex.id] = 1;
				}

				// Set the shift for this island
				shift = {'a':{'q':islands[i].hexes[0].hex.q,'r':islands[i].hexes[0].hex.r},'b':{'q':islands[i].hexes[0].hex.q + islands[i].dq,'r':islands[i].hexes[0].hex.r + islands[i].dr}};
				movable = true;
				for(h = 0; h < islands[i].hexes.length; h++){
					hex = this.display.getShiftedCoords(islands[i].hexes[h],shift);
					id = hex[0]+','+hex[1];
					shifted.push({'id':id,'q':hex[0],'r':hex[1]});
					// Does this ID already exist? If so we won't move the island
					if(id in lookup) movable = false;
				}
				// Only move islands if we are able to move it
				if(movable){
					for(h = 0; h < shifted.length; h++){
						this.display.shiftHex(islands[i].hexes[h],shift);
					}
				}
			}
			return this;
		};

		this.updateSelectionBorder = function(){
			return this.mergedBorder(this.selectedHexes,this.display.layout);
		};

		this.selectHexAt = function(q,r){
			var m = -1;
			for(var i = 0; i < this.display.hexes.length; i++){
				if(this.display.hexes[i].hex.q==q && this.display.hexes[i].hex.r==r) m = i;
			}
			if(m >= 0) this.selectHex(this.display.hexes[m]);
			else msg.error("No matching hex for "+q+","+r);
			return this;
		}

		this.selectHex = function(h,noborderupdate){
			h.select();
			var idx = this.selectedHexes.indexOf(h);
			if(idx < 0) this.selectedHexes.push(h);
			if(!noborderupdate) this.updateSelectionBorder();
			this.updateSelectedColour(h.getColour())
			return this;
		};

		this.deselectHex = function(h,noborderupdate){
			//msg.info('deselectHex: '+h.hex.q+','+h.hex.r,h.hex,h.hex,{'fade':2000});
			h.deselect();
			var idx = this.selectedHexes.indexOf(h);
			if(idx >= 0) this.selectedHexes.splice(idx,1);
			else msg.warn('No hexagon to deselect');
			if(!noborderupdate) this.updateSelectionBorder();
			return this;
		};

		this.selectBySameColour = function(){
			if(this.selectedHexes.length > 0){
				var last = this.selectedHexes.splice(this.selectedHexes.length-1,1)[0];
				var c = last.getColour();
				for(h = 0; h < this.display.hexes.length; h++){
					if(this.display.hexes[h].getColour()==c && this.display.hexes[h]!=last){
						this.selectHex(this.display.hexes[h],true);
						this.display.hexes[h].toFront();
					}
				}
				// Move the last selected hex to the end
				this.selectedHexes.push(last);
				this.updateSelectedColour(c);
			}else{
				msg.warn('No hexagon selected.');
			}
			this.updateSelectionBorder();
			return this.updateView();
		};

		this.deselectBySameColour = function(){
			if(this.selectedHexes.length > 0){
				var c = this.selectedHexes[this.selectedHexes.length-1].getColour();
				for(h = this.selectedHexes.length-1; h >= 0; h--){
					if(this.selectedHexes[h].getColour()==c) this.deselectHex(this.selectedHexes[h],true);
				}
			}else{
				msg.warn('No hexagon selected.');
			}
			this.updateSelectionBorder();
			return this.updateView();
		};

		this.selectAllHexes = function(){
			for(h = 0; h < this.display.hexes.length; h++){
				if(!this.display.hexes[h].isSelected()){
					this.display.hexes[h].select();
					this.selectedHexes.push(this.display.hexes[h]);
				}
			}
			document.getElementById('btn-deselect').disabled = false;
			this.updateSelectionBorder();
			return this.updateView();
		};

		this.deselectAllHexes = function(){
			for(h = 0; h < this.display.hexes.length; h++) this.display.hexes[h].deselect();
			this.selectedHexes = [];
			document.getElementById('btn-deselect').disabled = true;
			this.updateSelectionBorder();
			return this.updateView();
		};

		this.removeAllHexes = function(){
			for(h = 0; h < this.display.hexes.length; h++) this.display.hexes[h].remove();
			this.display.hexes = [];
			this.selectedHexes = [];
			document.getElementById('btn-removeall').disabled = true;
			this.updateSelectionBorder();
			return this.updateView();
		};

		this.removeSelectedHexes = function(){
			var i,idx;
			if(this.selectedHexes.length==0) return this;
			for(var i = 0; i < this.selectedHexes.length; i++){
				idx = this.display.hexes.indexOf(this.selectedHexes[i]);
				if(idx >= 0){
					this.display.hexes[idx].remove();
					this.display.hexes.splice(idx,1);
				}
			}
			this.selectedHexes = [];
			this.updateSelectionBorder();
			return this.updateView();
		};

		this.moveTo = function(p){
			if(this.selectedHexes.length > 0){
				var h = clickedHex||this.selectedHexes[this.selectedHexes.length-1];
				shift = {'a':h.hex,'b':p};
				for(var i = 0; i < this.selectedHexes.length; i++){
					if(shift.b.q!=shift.a.q || shift.b.r!=shift.a.r){
						this.display.shiftHex(this.selectedHexes[i],shift);
					}
				}
			}
		};

		this.updateFileDetails = function(){
			msg.log('Update file details',document.getElementById('standard_files').files);
			var el = document.getElementById('standard_files');
			var txt = '';
			if(el.files && el.files[0]){
				var myFile = el.files[0];
				txt = 'File: <em>'+myFile.name+'</em><br />Size: '+niceSize(myFile.size);
			}
			document.querySelector('#drop_zone .info').innerHTML = txt;
			return this;
		};

		this.readFile = function(myFile){
			msg.log('readFile',myFile);
			var reader = new FileReader();
			reader.readAsText(myFile, "UTF-8");
			reader.addEventListener('load',function(e){
				var json = JSON.parse(e.target.result);
				_obj.addHexJSON(json);
				_obj.setVisible("map");
			});
			reader.onerror = function(e){ msg.error('Failed to read file'); };
			return this;
		};

		this.getURL = function(url){
			if(url){
				msg.log('getURL',url);
				fetch(url,{}).then(response => {
					if(!response.ok) throw new Error('Network response was not OK');
					return response.json();
				}).then(json => {
					this.addHexJSON(json);
					this.setVisible("map");
					if(url.match(/uk-wards-2024/)){
						// Make banner
						var txt = 'This is part of a project to <a href="https://github.com/open-innovations/uk-wards-2024/">create a hex layout of all UK wards</a>.';
						var m = url.match(/uk-wards-2024\/([EWNS][0-9]{8}\.hexjson)/);
						if(m){
							txt += ' If you\'d like to help improve the layout, please rearrange hexes following the <a href="https://github.com/open-innovations/uk-wards-2024/?tab=readme-ov-file#design-guidelines">design guidelines</a>. Changes are <em>not automatically saved</em> - if you want to contribute your changes you should go to File&gt;Save HexJSON, save the file, and then update the <a href="https://github.com/open-innovations/uk-wards-2024/blob/main/'+m[1]+'">'+m[1]+'</a> file in the repository.';
						}
						var m = url.match(/uk-wards-2024\/LAD\/([EWNS][0-9]{8}\.hexjson)/);
						if(m){
							var keysArray = Object.keys(json.hexes);
							var lad = json.hexes[keysArray[0]].LAD24NM;
							txt += ' If you\'d like to help improve the layout for <strong>'+lad+'</strong>, please rearrange hexes following the <a href="https://github.com/open-innovations/uk-wards-2024/?tab=readme-ov-file#design-guidelines">design guidelines</a>. Changes are <em>not automatically saved</em> - if you want to contribute your changes you should go to File&gt;Save HexJSON, save the file, and then update the <a href="https://github.com/open-innovations/uk-wards-2024/blob/main/LAD/'+m[1]+'">'+m[1]+'</a> file in the repository.';
						}
						msg.info(txt,{'id':'uk-wards-2024'});
					}
				}).catch(e => {
					msg.error('There has been a problem loading CSV data from <em>%c'+url+'%c</em>. It may not be publicly accessible or have some other issue.','font-style:italic;','font-style:normal;');
				});
			}
			return this;
		};

		this.incrementVersion = function(v){
			var vs = v.split(/\./);
			var i = vs.length-1;
			vs[i] = parseInt(vs[i])+1;
			return vs.join(".");
		};

		this.saveHexJSON = function(){
			var str,file,type,c,r,m,cols,hexjson,before;

			type = "text/json";
			file = "test.json";

			if(this.query.url) file = this.query.url;
			if(document.getElementById('url').value) file = document.getElementById('url').value;
			if(document.getElementById('standard_files').files.length > 0) file = document.getElementById('standard_files').files[0].name;
			file = file.replace(/.*\/([^\/])/,function(m,p1){ return p1; });

			before = JSON.stringify(this.hexjson).replace(/,"id":"([^\"]+)","layout":"([^\"]+)"/g,"");
			hexjson = this.getHexJSON();
			after = JSON.stringify(hexjson);
			if(!("version" in hexjson)) hexjson.version = "0.1";
			if(before!=after) hexjson.version = this.incrementVersion(hexjson.version);

			str = JSON.stringify(hexjson);
			str = str.replace(/\{\"layout\"/,"{\n\t\"layout\"").replace(/\,\"(version|boundaries|hexes)\":([\{]?)/g,function(m,p1,p2){ return ",\n\t\""+p1+"\":"+(p2 ? p2+"\n\t\t":""); }).replace(/\}\,"([^\"]+)":\{/g,function(m,p1){ return "\},\n\t\t\""+p1+"\":{"; }).replace(/\}\}\,/,"\}\n\t\},").replace(/\}\}$/,"\n\t\}\n\}").replace(/\{\"hexes\"\:\{\"/,"\{\n\t\"hexes\"\:\{\n\t\t\"").replace(/\,\"layout\"/,"\,\n\t\"layout\"").replace(/([0-9])\},\n/g,function(m,p1){ return p1+' },\n'; }).replace(/\}$/,"\n\}");

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

		this.getHexJSON = function(){
			var i,json,d,id;
			json = JSON.parse(JSON.stringify(this.hexjson));
			json.hexes = {};
			json.layout = this.display.layout;
			for(i = 0; i < this.display.hexes.length; i++){
				d = JSON.parse(JSON.stringify(this.display.hexes[i].getOpts()));
				id = d.id;
				d.q = this.display.hexes[i].hex.q;
				d.r = this.display.hexes[i].hex.r;
				d.colour = this.display.hexes[i].getColour();
				delete d.id;
				delete d.layout;
				json.hexes[id] = d;
			}
			return json;
		};

		this.addHexJSON = function(hexjson){
			var arr,h;
			this.hexjson = hexjson;
			msg.log('loadHexJSON',hexjson);
			this.display.addHexJSON(hexjson);
			setTimeout(function(){ _obj.zoomToBBox().updateView(); },100);
			return this;
		};

		this.setVisible = function(a){
			el.main.style.display = (a=='map' ? 'block':'none');
			el.open.style.display = (a=='open' ? 'block':'none');
			el.foot.style.display = (a=='about' ? 'block':'none');
			return this;
		}

		this.toggleOpenDialog = function(){
			msg.log('toggle',window.getComputedStyle(document.getElementById('dialog-open')).display);
			if(window.getComputedStyle(document.getElementById('dialog-open')).display=="none") this.setVisible("open");
			else this.setVisible("map");
			return this;
		};

		this.setScale = function(z){
			z = this.limitZoom(z);
			this.display.setScale(z);
			el.zoom.value = z;
			return this.updateView();
		};

		this.limitZoom = function(z){ return Math.max(minz,Math.min(maxz,z)); }

		this.zoomIn = function(x,y){
			this.zoomAround(null,null,parseFloat(el.zoom.value)*0.8)
			return this;
		};
		this.zoomOut = function(x,y){
			this.zoomAround(null,null,parseFloat(el.zoom.value)*1.25)
			return this;
		};
		this.zoomAround = function(x,y,z){
			z = this.limitZoom(z);
			el.zoom.value = z;
			this.display.zoomAround(x,y,z);
			return this.setScale(z);
		};
		this.zoomToBBox = function(){
			s = this.display.zoomToBBox();
			this.setScale(s);
			return this;
		};
		this.zoomToHex = function(hex){
			var xy = getXY(hex.hex.q,hex.hex.r,this.display.layout);
			this.display.centre = xy;
			this.setScale(2);
			return this;
		};

		this.toggleAbout = function(){
			var f = window.getComputedStyle(el.foot).display;
			this.setVisible(f=="none" ? "about":"map");
			return this;
		};

		this.toggleInfo = function(){
			this.show.info = !this.show.info;
			if(this.show.info){
				var el = document.getElementById('hex-info');
				if(el) el.style.display = '';
			}else this.clearInfo();
			return this;
		};

		this.setInfo = function(h){
			var el = document.getElementById('hex-info');
			if(el && this.show.info){
				var o = h.getOpts();
				var txt = '',p;
				txt = '<span class="value">'+(o.n||o.name)+'</span>';
				txt += '<br /><span class="r">row (r)</span>: <span class="r">'+h.hex.r+'</span>, <span class="q">col (q)</span>: <span class="q">'+h.hex.q+'</span>';
				for(p in o){
					if(p!="n" && p!="r" && p!="q" && p!="layout" && p!="name") txt += '<br />'+p+': <span class="value">'+o[p]+'</span>';
				}
				el.innerHTML = txt;
				el.style.display = '';
			}
			return this;
		};

		this.clearInfo = function(){
			var el = document.getElementById('hex-info');
			if(el){
				el.innerHTML = '';
				el.style.display = 'none';
			}
		}

		this.mergedBorder = function(hexes,layout){
			var i,p,polygons,lookup = {},path = '',pt,h,pos,edge,b,poly;
			b = el.canvas.querySelector('.selection');
			if(!b){
				b = makeEl('path','svg');
				b.classList.add('selection');
				el.canvas.append(b);
			}
			if(hexes && hexes.length>0){
				for(i = 0; i < hexes.length; i++) lookup[hexes[i].hex.id] = {'i':i,'hex':hexes[i].hex,'done':0,'checked':[false,false,false,false,false,false]};
				polygons = followBorder(layout,lookup,hexes[0].hex.id);
				// Create the boundary
				for(p = 0; p < polygons.length; p++){
					if(poly) path += poly+'z';
					poly = '';
					for(i = 0; i < polygons[p].length; i++){
						pt = polygons[p][i];
						h = Hex(pt.q,pt.r);
						pos = getXY(pt.q,pt.r,layout);
						edge = h.edge(layout,pt.e);
						if(i==0){
							poly += 'M'+(pos.x + edge[0][0]*_hexs)+' '+(pos.y + edge[0][1]*_hexs);
						}
						poly += 'L'+(pos.x + edge[1][0]*_hexs)+' '+(pos.y + edge[1][1]*_hexs);
					}
				}
				if(poly) path += poly+'z';
			}
			setAttr(b,{'d':path,'fill':'transparent','pointer-events':'none','vector-effect':'non-scaling-stroke'});
			return this;
		}

		this.setSelectedColour = function(c){
			for(h = 0; h < this.display.hexes.length; h++){
				if(this.display.hexes[h].isSelected()) this.display.hexes[h].setColour(c);
			}
			return this.updateView();
		};

		return this.init();
	}

	function followBorder(layout,lookup,id,edge,str){
		if(typeof str!=="object") str = [[]];
		if(typeof edge!=="number") edge = 0;
		var i,nextid,nedge,ids,idx;

		// Have we already checked this edge? If we have, we need to find a hex that hasn't been done and try drawing that
		if(lookup[id].checked[edge]){
			nextid = id;
			if(lookup[id].done==6){
				// Find the next hexagon
				ids = Object.keys(lookup);
				idx = ids.indexOf(id)+1;
				// If this was the last hex we can return
				while(idx < ids.length && lookup[ids[idx]].done==6){ idx++; }
				if(idx >= ids.length) return str;
				nextid = ids[idx];
			}
			// Find an unchecked edge on this hex
			for(i = 0; i < 6; i++){
				if(!lookup[nextid].checked[i]){
					// Create a new polygon
					str.push([]);
					str = followBorder(layout,lookup,nextid,i,str);
					continue;
				}
			}
			return str;
		}

		// Get the neighbours for this hex
		var n = lookup[id].hex.neighbours(layout);

		// Check if there is a neighbour on this edge
		nextid = n[edge].id;

		// Set this edge to done
		if(!lookup[id].checked[edge]){
			lookup[id].checked[edge] = true;
			lookup[id].done++;
		}
		if(lookup[nextid]){
			// There is a hex here so we move to that hex
			// The new edge to check is two back from the one we are on
			nedge = (edge-2+6)%6;
			str = followBorder(layout,lookup,nextid,nedge,str);
		}else{
			// No neighbour exists on this edge so draw it
			str[str.length-1].push({'id':id,'q':lookup[id].hex.q,'r':lookup[id].hex.r,'e':edge+1});
			nedge = (edge+1)%6;
			// Check the next edge
			str = followBorder(layout,lookup,id,nedge,str);
		}
		return str;
	}

	function HexDisplay(svg,opts){
		if(!opts) opts = {};
		var msg = new OI.logger('HexDisplay v2',{el:document.getElementById('messages'),'visible':['info','warning','error'],'fade':60000,'class':'msg'});
		var grid,hexes;
		var main = svg.parentElement;
		this.layout = "odd-r";	// default
		this.wide = main.offsetWidth;
		this.tall = main.offsetHeight;
		this.centre = {'x':this.wide/2,'y':this.tall/2};
		this.showlabels = (typeof opts.labels==="boolean" ? opts.labels : false);
		this.showgrid = (typeof opts.grid==="boolean" ? opts.grid : true);
		this.scale = 1;
		this.hexes = [];
		var padding = 16;

		this.init = function(){
			msg.log("init");
			this.setLayout(this.layout);

			// Build data layer if needed
			var dl = svg.querySelector('.data-layer');
			if(!dl){
				dl = makeEl("g","svg");
				dl.setAttribute("role","table");
				dl.classList.add('data-layer');
				svg.append(dl);
			}
			if(!hexes){
				hexes = makeEl("g","svg");
				hexes.setAttribute("role","row");
				hexes.classList.add('series');
				dl.append(hexes);
			}

			return this;
		};

		this.setScale = function(z){
			this.scale = z;
			return this.updateViewBox();
		};

		this.setLayout = function(l){
			this.layout = l;
			this.updateGrid();
			return this;
		};

		this.updateViewBox = function(){
			var w = (this.wide*this.scale);
			var h = (this.tall*this.scale);
			var xoff = this.centre.x - this.scale*this.wide/2;
			var yoff = this.centre.y - this.scale*this.tall/2;
			svg.setAttribute('viewBox',xoff.toFixed(2)+' '+yoff.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2));
			if(grid){
				grid.setAttribute('x',xoff.toFixed(2));
				grid.setAttribute('y',yoff.toFixed(2));
			}
			return this;
		};

		this.toggleGrid = function(){
			this.showgrid = !this.showgrid;
			return this.updateGrid();
		};

		this.updateGrid = function(){
			var q,r,defs;
			defs = svg.querySelector('defs');
			if(!defs){
				defs = makeEl("defs","svg");
				svg.prepend(defs);
			}
			q = svg.getElementById('pattern-q');
			r = svg.getElementById('pattern-r');
			if(!q){
				q = makeEl("pattern","svg");
				defs.append(q);
			}
			if(!r){
				r = makeEl("pattern","svg");
				defs.append(r);
			}

			if(!grid) grid = svg.getElementById('grid');
			if(!grid){
				grid = makeEl("rect","svg");
				setAttr(grid,{'id':'grid','x':"-50%",'y':"-50%",'fill':"url(#pattern-r)",'width':"100%",'height':"100%"});
				svg.prepend(grid);
			}

			if(this.showgrid){
				setAttr(q,{'id':'pattern-q','width':(_hexs*3),'height':(_hexsb*2),'patternUnits':'userSpaceOnUse'});
				q.innerHTML = '<path stroke="#cbd5e1" stroke-width="0.7" d="M'+(_hexs*2)+' 0H'+_hexs+'L'+(_hexs/2)+' '+_hexsb+'l'+(_hexs/2)+' '+_hexsb+'h'+_hexs+'l'+(_hexs/2)+'-'+_hexsb+'zM150 '+_hexsb+'h'+(_hexs/2)+'M0 '+_hexsb+'h'+(_hexs/2)+'" fill="none"  vector-effect="non-scaling-stroke" />';
				setAttr(r,{'id':'pattern-r','width':(_hexsb*2),'height':(_hexs*3),'patternUnits':'userSpaceOnUse'});
				r.innerHTML = '<path stroke="#cbd5e1" stroke-width="0.7" d="M'+_hexsb+' '+(_hexs/2)+'v-'+(_hexs/2)+'m0 '+(_hexs/2)+'l'+_hexsb+' '+(_hexs/2)+'v'+_hexs+'l-'+_hexsb+' '+(_hexs/2)+'v'+(_hexs/2)+'m0 -'+(_hexs/2)+'l-'+_hexsb+' -'+(_hexs/2)+' v-'+_hexs+'l'+_hexsb+' -'+(_hexs/2)+'" fill="none"  vector-effect="non-scaling-stroke" />';
			}else{
				q.innerHTML = '';
				r.innerHTML = '';
			}
			grid.setAttribute('fill',(this.layout.indexOf('-r')>0) ? 'url(#pattern-r)':'url(#pattern-q)');
			return this;
		}

		this.setHeight = function(h){
			main.style['max-height'] = h+'px';
			this.wide = main.offsetWidth;
			this.tall = main.offsetHeight;
			this.updateViewBox();
			if(typeof opts.resize==="function") opts.resize.call(this,h);
			return this;
		};

		this.addHexJSON = function(hexjson){
			this.setLayout(hexjson.layout);
			for(h in hexjson.hexes){
				hexjson.hexes[h].id = h;
				this.addHex(hexjson.hexes[h],opts.hex);
			}
			return this;
		};

		this.screenToCanvas = function(p){
			var xoff = this.centre.x - this.scale*this.wide/2;
			var yoff = this.centre.y - this.scale*this.tall/2;
			var bbox = main.getBoundingClientRect();
			p.y -= bbox.y;
			p.x -= bbox.x;
			return {x:xoff+(p.x*this.scale),y:yoff+(p.y*this.scale)};
		};

		this.screenToRQ = function(p){
			var c = this.screenToCanvas(p);
			return getRQ(c.x,c.y,this.layout);
		};

		this.removeHex = function(i){
			if(i >= 0 && i < this.hexes.length){
				h = this.hexes.splice(i,1);
				h[0].remove();
			}
			return this.updateView();
		};
		this.addHex = function(opt,extra){
			if(!opt) opt = {};
			opt.layout = this.layout;
			var h = new Hexagon(opt,extra);
			this.hexes.push(h);
			h.addTo(hexes);
			if(this.showlabels) h.showLabel();
			return this;
		};
		this.toggleLabels = function(){
			this.showlabels = !this.showlabels;
			msg.log('toggleLabels',this.showlabels);
			for(i = 0; i < this.hexes.length; i++){
				if(this.showlabels) this.hexes[i].showLabel();
				else this.hexes[i].hideLabel();
			}
			return this;
		};

		this.panBy = function(dx,dy){
			this.centre.x -= dx*this.scale;
			this.centre.y -= dy*this.scale;
			return this;
		};

		function isOdd(v){ return (v&1==1) ? true : false; }
		function isEven(v){ return (v&1==1) ? false : true; }
		this.getShiftedCoords = function(hexagon,shift){
			var dq,dr,layout;
			layout = this.layout;
			dq = shift.b.q - shift.a.q;
			dr = shift.b.r - shift.a.r;
			if(layout == "odd-r"){
				// If the original hex is shifting from an even row to an odd row then:
				//   - if the current hex is on an even row it has the same dq
				//   - if the current hex is on an odd row it increases dq by 1
				if(isEven(shift.a.r) && isOdd(shift.b.r) && isOdd(hexagon.hex.r)) dq++;
				// If the original hex is shifting from an odd row to an even row then:
				//   - if the current hex is on an even row we need to decrease dq by 1
				//   - if the current hex is on an odd row it has the same dq
				if(isOdd(shift.a.r) && isEven(shift.b.r) && isEven(hexagon.hex.r)) dq--;
			}else if(layout == "even-r"){
				// If the original hex is shifting from an even row to an odd row then:
				//   - if the current hex is on an even row it has the same dq
				//   - if the current hex is on an odd row it decreases dq by 1
				if(isEven(shift.a.r) && isOdd(shift.b.r) && isOdd(hexagon.hex.r)) dq--;
				// If the original hex is shifting from an odd row to an even row then:
				//   - if the current hex is on an even row we need to increase dq by 1
				//   - if the current hex is on an odd row it has the same dq
				if(isOdd(shift.a.r) && isEven(shift.b.r) && isEven(hexagon.hex.r)) dq++;
			}else if(layout == "odd-q"){
				// If the original hex is shifting from an even column to an odd column then:
				//   - if the current hex is on an even column it has the same row shift
				//   - if the current hex is on an odd column it increases dr by 1
				if(isEven(shift.a.q) && isOdd(shift.b.q) && isOdd(hexagon.hex.r)) dr++;
				// If the original hex is shifting from an odd column to an even column then:
				//   - if the current hex is on an even column we need to decrease dr by 1
				//   - if the current hex is on an odd column it has the same dr
				if(isOdd(shift.a.q) && isEven(shift.b.q) && isEven(hexagon.hex.q)) dr--;
			}else if(layout == "even-q"){
				// If the original hex is shifting from an even column to an odd column then:
				//   - if the current hex is on an even column it has the same row shift
				//   - if the current hex is on an odd column it needs to decrease dr by 1
				if(isEven(shift.a.q) && isOdd(shift.b.q) && isOdd(hexagon.hex.r)) dr--;
				// If the original hex is shifting from an odd column to an even column then:
				//   - if the current hex is on an even column we neeed to inccrease dr by 1
				//   - if the current hex is on an odd column it has the same dr
				if(isOdd(shift.a.q) && isEven(shift.b.q) && isEven(hexagon.hex.q)) dr++;
			}
			return [hexagon.hex.q + dq, hexagon.hex.r + dr];
		};
		this.shiftHex = function(hexagon,shift){
			var d = this.getShiftedCoords(hexagon,shift);
			hexagon.setCoords(d[0],d[1]);
			return hexagon.hex;
		}
		this.zoomToBBox = function(){
			var bboxh,bboxg,x,y,f = null;
			bboxh = hexes.getBoundingClientRect();
			if(bboxh.width>0){
				bboxg = grid.getBoundingClientRect();
				x = bboxh.x-bboxg.x;
				y = bboxh.y-bboxg.y;
				// Centre the bbox
				this.centre.x += ((x + bboxh.width/2) - this.wide/2)*this.scale;
				this.centre.y += ((y + bboxh.height/2) - this.tall/2)*this.scale;
				f = Math.max((bboxh.height)/(bboxg.height-padding*2),(bboxh.width)/(bboxg.width-padding*2));
			}
			return this.scale*f;
		};
		this.zoomAround = function(x,y,z){
			if(x==null) x = this.wide/2;
			if(y==null) y = this.tall/2;
			this.centre.x += (x - this.wide/2)*this.scale - (x - this.wide/2)*z;
			this.centre.y += (y - this.tall/2)*this.scale - (y - this.tall/2)*z;
			return this;
		};

		return this;
	}

	var _hexs = 60;
	var _hexs2 = _hexs*1.5;
	var _hexsb = Math.round(_hexs*Math.cos(30*Math.PI/180));	// 52
	var _hexsb2 = _hexsb*2;	// 104
	var _hexpath = 'm0-'+_hexs+'l'+_hexsb+','+(_hexs/2)+',0,'+_hexs+',-'+_hexsb+','+(_hexs/2)+',-'+_hexsb+'-'+(_hexs/2)+',0-'+_hexs+','+_hexsb+'-'+(_hexs/2)+'z';
	var _sq3 = Math.sqrt(3);

	function getRQ(x,y,layout){
		var r,q;
		if(layout=="odd-r"){
			r = Math.floor(-((2*y/_sq3) - _hexsb)/_hexsb2);
			q = Math.floor(((x + _hexsb)/_hexsb2) + (r&1==1 ? -0.5 : 0));
		}else if(layout=="even-r"){
			// TO DO: check
			r = Math.floor(-((2*y/_sq3) - _hexsb)/_hexsb2);
			q = Math.floor(((x + _hexsb)/_hexsb2) + (r&1==1 ? 0.5 : 0));
		}else if(layout=="odd-q"){
			// TO DO
			//q = Math.round(-x/_hexs2);
			//r = -Math.round((y - (q&1==1 ? _hexsb : 0))/_hexsb2);
		}else if(layout=="even-q"){
			// TO DO
			//q = Math.round(-x/_hexs2);
			//y = -(r*_hexsb2 + (q&1==1 ? -_hexsb : 0));
			//r = -Math.round((y - (q&1==1 ? -_hexsb : 0))/_hexsb2);
		}
		return Hex(q,r);
	}

	function getXY(q,r,layout){
		var x,y;
		if(layout=="odd-r"){
			x = q*_hexsb2 + (r&1==1 ? _hexsb : 0);
			y = -r*_hexs2;
		}else if(layout=="even-r"){
			x = q*_hexsb2 + (r&1==1 ? -_hexsb : 0);
			y = -r*_hexs2;
		}else if(layout=="odd-q"){
			x = q*_hexs2;
			y = -(r*_hexsb2 + (q&1==1 ? _hexsb : 0));
		}else if(layout=="even-q"){
			x = q*_hexs2;
			y = -(r*_hexsb2 + (q&1==1 ? -_hexsb : 0));
		}
		return {x:x,y:y};
	}

	// A basic hex definition
	function HexDefinition(q,r){
		this.q = q;
		this.r = r;
		this.id = q+","+r;
		var f = Math.round(1e3*Math.sqrt(3)/2)/1e3;
		this.neighbours = function(l){
			var dirs = [],q,r,odd;
			q = this.q;
			r = this.r;
			if(l=="odd-r" || l=="even-r"){
				odd = (r&1==1);
				if(l=="even-r") odd = !odd;
				dirs = [Hex(odd ? q+1:q,r+1),Hex(q+1,r),Hex(odd ? q+1:q,r-1),Hex(odd ? q:q-1,r-1),Hex(q-1,r),Hex(odd ? q:q-1,r+1)];
			}else if(l=="odd-q" || l=="even-q"){
				odd = (q&1==1);
				if(l=="even-q") odd = !odd;
				dirs = [Hex(q,r+1),Hex(q+1,odd ? r:r+1),Hex(q+1,odd ? r-1:r),Hex(q,r-1),Hex(q-1,odd ? r-1:r),Hex(q-1,odd ? r:r+1)];
			}else{
				console.error("No layout type given");
			}
			return dirs;
		};
		this.edges = function(l){
			var c = [];
			if(l.indexOf("-r") > 0) return [[0,-1],[f,-.5],[f,.5],[0,1],[-f,.5],[-f,-.5]];
			else if(l.indexOf("-q") > 0) return [[-.5,-f],[.5,-f],[0,1],[.5,f],[-.5,f],[-1,0]];
			console.error("No layout type given");
			return [];
		};
		this.edge = function(l,i){
			var corners = [],edges = [],q,r,a,b,c;
			q = this.q;
			r = this.r;
			corners = this.edges(l);
			a = i-1;
			b = (a+1)%corners.length;
			return (i > 0) ? [corners[a],corners[b]] : [corners[b],corners[a]];
		};
		return this;
	}

	// Create a new hex definition
	function Hex(q,r){ return new HexDefinition(q,r); }

	// Create an SVG hexagon
	function Hexagon(opts,extra){
		if(!opts) opts = {};
		if(!extra) extra = {};
		var g,p,t,myel,fill,_obj = this;
		this.hex = null;
		this.getDom = function(){
			return g;
		};
		this.addTo = function(el){
			el.appendChild(g);
			myel = el;
			return this;
		};
		this.remove = function(){
			g.remove();
			return this;
		};
		this.setCoords = function(q,r){
			var c = getXY(q,r,opts.layout);
			g.setAttribute('transform','translate('+c.x+' '+c.y+')');
			g.setAttribute('data-q',q);
			g.setAttribute('data-r',r);
			this.hex = Hex(q,r);
			return this;
		};
		this.setText = function(arr){
			if(!("length" in arr)) arr = [arr];
			if(arr.length == 0) return this;
			var i,y,dy = _hexs/3,txt='';
			var fs = _hexs/4;
			for(i = 0, y = -(arr.length-1)*dy/2; i < arr.length; i++, y+=dy){
				txt += '<tspan class="'+(arr[i].class||"")+'" x="0" y="'+y+'" font-size="'+fs+'">'+arr[i].text+'</tspan>';
			}
			t.innerHTML = txt;
			return this;
		};
		this.showLabel = function(){
			var arr,bits,i;
			if(!t.innerHTML){
				if(opts.n){
					arr = [];
					bits = balanceText(opts.n,11);
					if(bits){
						for(i = 0; i < bits.length; i++) arr.push({'text':bits[i]});
					}
				}else{
					arr = [{'text':'q:'+this.hex.q,'class':'on q'},{'text':'r:'+this.hex.r,'class':'on r'}]
				}
				this.setText(arr);
			}
			t.style.display = '';
			this.updateLabelColour();
			return this;
		};
		this.hideLabel = function(){
			t.style.display = 'none';
			return this;
		};
		this.updateLabelColour = function(){
			t.style.fill = contrast(this.getColour());
			return this;
		};
		this.getOpts = function(){ return opts; };
		this.toFront = function(){
			if(myel) myel.appendChild(g);
			return this;
		};
		this.toBack = function(){
			if(myel) myel.prepend(g);
			return this;
		};
		this.isSelected = function(){
			return selected;
		};
		this.select = function(){
			selected = true;
			g.classList.add('selected');
			return this;
		};
		this.deselect = function(){
			selected = false;
			g.classList.remove('selected');
			g.classList.remove('hovered');
			return this;
		};
		this.getColour = function(){
			return fill;
		};
		this.setColour = function(c){
			fill = c||"#ccc";
			p.setAttribute('fill',fill);
			if(c){
				p.setAttribute('stroke-width','0.75');
				p.setAttribute('stroke',c);
			}
			this.updateLabelColour();
			return this;
		};

		g = makeEl("g","svg");
		p = makeEl("path","svg");
		t = makeEl("text","svg");
		g.appendChild(p);
		g.appendChild(t);

		g.classList.add('hex');
		g.setAttribute('role','cell');
		g.setAttribute('aria-label',opts.n||opts.name);
		p.setAttribute('vector-effect',"non-scaling-stroke");
		p.setAttribute('d',_hexpath);
		p.setAttribute('transform',(opts.layout.indexOf('-r') > 0 ? "rotate(0)" : "rotate(30)"));
		p.setAttribute('transform-origin',_hexsb+","+_hexs);
		this.setColour(opts.fill||opts.colour);
		if(opts.id){
			p.setAttribute('data-id',opts.id);
			this.id = opts.id;
		}

		t.setAttribute('dominant-baseline','central');
		t.setAttribute('text-anchor','middle');
		t.setAttribute('x','0');
		t.setAttribute('y','0');

		var selected = false;
		// Add events to hexagon
		if(extra.on){
			for(var ev in extra.on) addEv(ev,g,{'me':this,'type':ev},function(e){ extra.on[e.data.type].call(e.data.me,e); });
		}
		if(typeof opts.q==="number" && typeof opts.r==="number") this.setCoords(opts.q,opts.r);
		return this;
	}

	function Search(builder,opts){
		if(!opts) opts = {};
		if(typeof opts.max!=="number") opts.max = 10;

		var el,inp,btn,_obj,out,div,selected = -1;
		_obj = this;

		if(typeof opts.score!=="function"){
			opts.score = function(h,str){
				str = str.toLowerCase();
				var props = h.getOpts();
				var score = 0;
				var name;
				if("n" in props){
					name = props.n.toLowerCase();
					if(name.indexOf(str)==0) score += 1;
					if(name.indexOf(str)>0) score += 0.5;
				}
				return score;
			};
		}

		this.open = function(){
			inp.style.display = "";
			return this;
		};
		this.close = function(){
			inp.style.display = "none";
			inp.value = "";
			out.innerHTML = "";
			return this;
		};
		
		this.addTo = function(el){
			if(el){
				if(!div){
					div = document.createElement('div');
					div.classList.add('placesearch');
					div.innerHTML = '<button class="submit" href="#" title="Search" role="button" aria-label="Search"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg></button><div><input class="place" name="place" value="" placeholder="Search for a named area" aria-label="Search for a named area" type="text" /><div class="results"></div></div></div>';
				}
				el.appendChild(div);
				btn = div.querySelector('.placesearch button');
				inp = div.querySelector('input[type="text"]');
				out = div.querySelector('.results');
				btn.addEventListener('click',function(e){
					inp.style.display = (inp.style.display=="none" ? "":"none");
					selected = -1;
					if(inp.style.display=="") inp.focus();
				});
				inp.addEventListener('keydown',function(e){
					e.stopPropagation();
				});
				inp.addEventListener('keyup',function(e){
					e.preventDefault();
					e.stopPropagation();
					if(e.key=="ArrowDown") _obj.nav(1);
					else if(e.key=="ArrowUp") _obj.nav(-1);
					else if(e.key=="Enter") _obj.select();
					else _obj.searchResults(e.target.value);
				});
				this.close();
			}
			return this;
		};
		this.searchResults = function(str){
			str = str.toLowerCase();
			var results = [],score,i,idx,max;

			if(builder.display.hexes.length > 0){
				for(i = 0; i < builder.display.hexes.length; i++){
					score = opts.score.call(this,builder.display.hexes[i],str);
					if(score > 0){
						results.push({'id':i,'rank':score});
					}
				}
				results = results.sort(function (a, b) {
					return a.rank < b.rank ? 1 : -1;
				});
			}

			if(results.length) selected = -1;
			max = Math.min(opts.max,results.length);
			html = '';
			for(i = 0; i < max; i++){
				html += '<li role="option" data-id="' + results[i].id + '" aria-selected="false" tabindex="-1">' + (typeof opts.render==="function" ? opts.render(builder.display.hexes[results[i].id].getOpts()) : builder.display.hexes[results[i].id].getOpts().n ) + "</li>";
			}
			out.innerHTML = (html ? '<ol role="listbox">'+html+'</ol>' : '');
			var li = out.querySelectorAll('li');
			li.forEach((el,i) => {
				el.addEventListener('click',function(){
					_obj.setSelected(i);
					_obj.select();
				})
			});
			
			return this;
		};
		this.setSelected = function(i){
			selected = i;
			var li = out.querySelectorAll('li');
			var sel = out.querySelectorAll('li.selected');
			sel.forEach(el => el.classList.remove('selected'));
			if(selected < 0) selected = li.length-1;
			if(selected > li.length-1) selected = 0;
			li[selected].classList.add('selected');
			return this;
		};
		this.nav = function(i){
			return this.setSelected(selected += i);
		};
		this.select = function(){
			var sel = out.querySelector('li.selected');
			var id = parseInt(sel.getAttribute('data-id'));
			var hex = builder.display.hexes[id].getDom();
			trigger(hex,'mousedown');
			builder.display.hexes[id].select();
			trigger(hex,'mouseup');
			trigger(hex,'mouseover');
			builder.zoomToHex(builder.display.hexes[id]);
			this.close();
			return this;
		};
		return this;
	}
	function trigger(el, eventType) {
		if(typeof eventType==='string' && typeof el[eventType]==='function'){
			el[eventType]();
		}else{
			const event =
			typeof eventType === 'string' ? new Event(eventType, {bubbles: true}) : eventType;
			el.dispatchEvent(event);
		}
	}
	function balanceText(t,max){
		var lines = [];
		var txt = "",end,i = 0,c;
		for(c = 0; c < t.length; c++){
			ch = t[c];
			if(ch==" " || ch=="-"){
				if(txt.length > max){
					end = "";
					if(txt.indexOf(" ")>=0){
						end = txt.substr(txt.lastIndexOf(" ")+1,)
						txt = txt.substr(0,txt.lastIndexOf(" "));
					}
					lines.push(txt);
					txt = "";
					if(end) txt += end+' ';
				}else{
					txt += ch;
				}
			}else{
				txt += ch;
			}
			if(c==t.length-1){
				if(txt.length > max){
					end = "";
					if(txt.indexOf(" ")>=0){
						end = txt.substr(txt.lastIndexOf(" ")+1,)
						txt = txt.substr(0,txt.lastIndexOf(" "));
					}
					lines.push(txt);
					txt = "";
					if(end) txt += end+' ';
				}
				lines.push(txt);
			}
		}
		for(c = 0; c < lines.length; c++){
			if(lines[c].length > max) lines[c] = lines[c].substr(0,max-2)+'…';
		}
		return lines;
	}
	function niceSize(b){
		if(b > 1e12) return (b/1e12).toFixed(2)+" TB";
		if(b > 1e9) return (b/1e9).toFixed(2)+" GB";
		if(b > 1e6) return (b/1e6).toFixed(2)+" MB";
		if(b > 1e3) return (b/1e3).toFixed(2)+" kB";
		return (b)+" bytes";
	}
	function setAttr(el,prop){
		for(var p in prop) el.setAttribute(p,prop[p]);
		return el;
	}
	function addEv(ev,el,data,fn){
		el.addEventListener(ev,function(e){
			e.data = data;
			fn.call(data.this||this,e);
		});
	}
	function makeEl(typ,ns){
		return (ns=="svg" ? document.createElementNS("http://www.w3.org/2000/svg",typ) : document.createElement(typ));
	}

	if(!OI.logger){
		// Version 1.5
		OI.logger = function(title,attr){
			if(!attr) attr = {};
			title = title||"OI Logger";
			var ms = {};
			this.logging = (location.search.indexOf('debug=true') >= 0);
			if(console && typeof console.log==="function"){
				this.log = function(){ if(this.logging){ console.log.apply(null,getParam(arguments)); updatePage('log',arguments); } };
				this.info = function(){ console.info.apply(null,getParam(arguments)); updatePage('info',arguments); };
				this.warn = function(){ console.warn.apply(null,getParam(arguments)); updatePage('warning',arguments); };
				this.error = function(){ console.error.apply(null,getParam(arguments)); updatePage('error',arguments); };
			}
			this.remove = function(id){
				var el = attr.el.querySelector('#'+id);
				if(ms[id]) clearTimeout(ms[id]);
				if(el) el.remove();
			};
			function updatePage(){
				if(attr.el){
					var id, el, visible = false;
					var cls = arguments[0];
					var txt = Array.prototype.shift.apply(arguments[1]);
					var opt = arguments[1]||{};
					if(opt.length > 0) opt = opt[opt.length-1];
					if(attr.visible.includes(cls)) visible = true;
					if(visible){
						id = "default";
						if(opt.id) id = opt.id;
						el = document.getElementById(id);
						if(!el){
							el = document.createElement('div');
							el.classList.add('message',cls);
							el.setAttribute('id',id);
						}
						if(attr.class) el.classList.add(...attr.class.split(/ /));
						el.innerHTML = '<div class="message-inner">'+txt.replace(/\%c/g,"")+'</div>';
						el.style.display = (txt ? '' : 'none');
						attr.el.prepend(el);
						var cls = document.createElement('div');
						cls.setAttribute('tabindex',0);
						cls.classList.add('close');
						cls.innerHTML = '&times;';
						cls.addEventListener('click',function(e){ clearTimeout(ms[id]); el.remove(); });
						el.appendChild(cls);
						ms[id] = setTimeout(function(){ el.remove(); },(typeof opt.fade==="number" ? opt.fade : (typeof attr.fade==="number" ? attr.fade : 10000)));
					}
				}
			}
			function getParam(){
				var a = Array.prototype.slice.call(arguments[0], 0);
				var str = (typeof a[0]==="string" ? a[0] : "");
				// Build basic result
				var ext = ['%c'+title+'%c: '+str.replace(/<[^\>]*>/g,""),'font-weight:bold;',''];
				var n = (str ? 1 : 0);
				// If there are extra parameters passed we add them
				return (a.length > n) ? ext.concat(a.splice(n)) : ext;
			}
			return this;
		};
	}
	OI.HexBuilder = function(opts){ return new HexBuilder(opts); };

	function h2d(h) {return parseInt(h,16);}
	function toLin(v){ v /= 255; if (v <= 0.03928){ return v/12.92; }else{ return Math.pow((v+0.055)/1.055,2.4); }}
	function rLum(rgb){ return 0.2126 * toLin(rgb[0]) + 0.7152 * toLin(rgb[1]) + 0.0722 * toLin(rgb[2]); }
	function cRatio(a, b){ let L1 = rLum(a); let L2 = rLum(b); if(L1 < L2){ let temp = L2; L2 = L1; L1 = temp; } return (L1 + 0.05) / (L2 + 0.05); }
	function contrast(c){ let rgb = [h2d(c.substring(1,3)),h2d(c.substring(3,5)),h2d(c.substring(5,7))]; return (cRatio(rgb,[0, 0, 0]) > cRatio(rgb,[255, 255, 255]) ? "black" : "white"); }

	root.OI = OI||root.OI||{};

})(window || this);