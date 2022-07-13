/**
	Open Innovations hex map search plugin
	Version 0.1.1
 */
(function(root){

	var OI = root.OI || {};

	function HexmapSearch(hex){
		
		this.active = false;
		this.selected = -1;
		var el,inp,btn,_obj,results;
		_obj = this;
		
		this.reset = function(){
//			el.innerHTML= "";
console.log('reset');
			return this;
		}

		this.init = function(){

			el = hex.el.querySelector('.hex-search');
			if(!el){
				el = document.createElement('div');
				el.classList.add('hex-search');
				el.innerHTML = '<div class="search-inner"><label for="constituencies" class="search-button"><svg xmlns="https://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 12 13"><g stroke-width="2" stroke="white" fill="none"><path d="M11.29 11.71l-4-4"/><circle cx="5" cy="5" r="4"/></g></svg></label><input type="text" class="search-input" name="constituencies" id="constituencies" value="" placeholder="e.g. Leeds Central"><ul class="search-results"></ul></div></div>';
				hex.el.insertBefore(el, hex.el.firstChild);
			}
			inp = el.querySelector('.search-input');
			btn = el.querySelector('.search-button');
			btn.addEventListener('click',function(e){
				_obj.selected = -1;
				_obj.toggle();
			});
			results = el.querySelector('.search-results');
			
			inp.addEventListener('keyup',function(e){
				var value = e.target.value.toLowerCase();
				var regions = {};
				var li = "";
				var n = 0;
				var v,nm;
				if(value.length > 1){
					console.log(hex.areas)
					for(var region in hex.areas){
						v = hex.areas[region].data.title||"";
						nm = hex.areas[region].data.name||hex.areas[region].data.n;
						if(v.toLowerCase().indexOf(value)>=0 || nm.toLowerCase().indexOf(value)>=0){
							regions[region] = true;
							if(n < 8){
								li += '<li><a href="#" data="'+region+'">'+(v||nm)+'</a></li>';
								n++;
							}
						}
					}
				}
				if(e.keyCode==40 || e.keyCode==38){
					// Down=40
					// Up=38
					if(e.keyCode==40) _obj.selected++;
					if(e.keyCode==38) _obj.selected--;
					n = results.querySelectorAll('a').length;
					if(_obj.selected < 0) _obj.selected = 0;
					if(_obj.selected >= n) _obj.selected = n-1;
					as = results.querySelectorAll('a');
					as.forEach(function(e){ e.classList.remove('selected'); });
					as[_obj.selected].classList.add('selected');
					if(_obj.selected >= 0){
						r = as[_obj.selected].getAttribute('data');
						trigger('mouseover',hex.areas[r].g);
					}
				}else if(e.keyCode==13){
					results.querySelectorAll('a.selected')
					trigger('click',results.querySelector('a.selected'));
				}else{
					// Add list of options
					results.innerHTML = li;
					as = results.querySelectorAll('a');
					as.forEach(function(a){
						a.addEventListener('click',function(e){
							e.preventDefault();
							e.stopPropagation();
							r = a.getAttribute('data');
							_obj.highlight({});
							trigger('click',hex.areas[r].g);
							// Remove the search results
							results.innerHTML = "";
						});
					});
					_obj.highlight(regions);
				}
			});
		};
		this.toggle = function(){
			this.active = !this.active;
			
			if(this.active){
				el.classList.add('searching');
				inp.focus();
				// Force the cursor to go to the end by clearing and resetting
				var v = inp.value;
				inp.value = '';
				inp.value = v;
				if(inp.value) trigger('keyup',inp);
			}else{
				el.classList.remove('searching');
				this.highlight({});
				// Remove the search results
				results.innerHTML = "";
			}
		};

		this.highlight = function(rs){
			this.n = 0;
			var region;
			for(region in rs){
				if(rs[region]) this.n++;
			}
			for(region in hex.areas){
				hex.areas[region].g.classList.remove('highlighted');
				hex.areas[region].g.classList.remove('not-highlighted');
				if(this.n>0){
					if(rs[region]){
						hex.areas[region].g.classList.add('highlighted');
						hex.toFront(region);
					}else{
						hex.areas[region].g.classList.add('not-highlighted');
					}
				}else{
					hex.areas[region].highlight = false;
				}
			}

			return this;
		};

		this.init();

		return this;
	}

	function trigger(ev,el){
		var e = document.createEvent('HTMLEvents');
		e.initEvent(ev, true, false);
		el.dispatchEvent(e);
	}

	OI.hexmapsearch = HexmapSearch;

	root.OI = OI;
})(window || this);