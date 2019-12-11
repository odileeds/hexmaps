/*!
 * stuQuery
 */
(function(root){

	var eventcache = {};

	function stuQuery(els){
		// Make our own fake, tiny, version of jQuery simulating the parts we need
		this.stuquery = "1.0.25";

		this.getBy = function(e,s){
			var i,m,k;
			i = -1;
			var result = [];
			if(s.indexOf(':eq') > 0){
				m = s.replace(/(.*)\:eq\(([0-9]+)\)/,'$1 $2').split(" ");
				s = m[0];
				i = parseInt(m[1]);
			}
			if(s[0] == '.') els = e.getElementsByClassName(s.substr(1));
			else if(s[0] == '#') els = e.getElementById(s.substr(1));
			else els = e.getElementsByTagName(s);
			if(!els) els = [];
			// If it is a select field we don't want to select the options within it
			if(els.nodeName && els.nodeName=="SELECT") result.push(els);
			else{
				if(typeof els.length!=="number") els = [els];
				for(k = 0; k < els.length; k++){ result.push(els[k]); }
				if(i >= 0 && result.length > 0){
					if(i < result.length) result = [result[i]];
					else result = [];
				}
			}
			return result;
		};
		this.matchSelector = function(e,s){
			// Does this one element match the s
			if(s[0] == '.'){
				s = s.substr(1);
				for(var i = 0; i < e.classList.length; i++) if(e.classList[i] == s) return true;
			}else if(s[0] == '#'){
				if(e.id == s.substr(1)) return true;
			}else{
				if(e.tagName == s.toUpperCase()) return true;
			}
			return false;
		};
		if(typeof els==="string") this.e = this.querySelector(document,els);
		else if(typeof els==="object") this.e = (typeof els.length=="number") ? els : [els];
		for(var it in this.e){
			if(this.e[it]) this[it] = this.e[it];
		}
		this.length = (this.e ? this.e.length : 0);

		return this;
	}
	stuQuery.prototype.querySelector = function(els,selector){
		var result = [];
		var a,els2,i,j,k,tmp;
		if(selector.indexOf(':eq') >= 0){
			a = selector.split(' ');
			for(i = 0; i < a.length; i++){
				if(i==0){
					tmp = this.getBy(els,a[i]);
				}else{
					els2 = [];
					for(j = 0; j < tmp.length; j++) els2 = els2.concat(this.getBy(tmp[j],a[i]));
					tmp = els2.splice(0);
				}
			}
		}else tmp = els.querySelectorAll(selector);					// We can use the built-in selector
		for(k = 0; k < tmp.length; k++){ result.push(tmp[k]); }
		return result;
	};
	stuQuery.prototype.ready = function(f){
		if(/in/.test(document.readyState)) setTimeout('S(document).ready('+f+')',9);
		else f();
	};
	stuQuery.prototype.html = function(html){
		// Return HTML or set the HTML
		if(typeof html==="number") html = ''+html;
		if(typeof html!=="string" && this.length == 1) return this[0].innerHTML;
		if(typeof html==="string") for(var i = 0; i < this.length; i++) this[i].innerHTML = html;
		return this;
	};
	stuQuery.prototype.append = function(html){
		if(!html && this.length == 1) return this[0].innerHTML;
		if(html){
			for(var i = 0; i < this.length; i++){
				var d = document.createElement('template');
				d.innerHTML = html;
				var c = (typeof d.content==="undefined" ? d : d.content);
				if(c.childNodes.length > 0) while(c.childNodes.length > 0) this[i].appendChild(c.childNodes[0]);
				else this[i].append(html);
			}
		}
		return this;	
	};
	stuQuery.prototype.prepend = function(t){
		var i,j,d,e;
		if(!t && this.length==1) return this[0].innerHTML;
		for(i = 0 ; i < this.length ; i++){
			d = document.createElement('div');
			d.innerHTML = t;
			e = d.childNodes;
			for(j = e.length-1; j >= 0; j--) this[i].insertBefore(e[j], this[i].firstChild);
		}
		return this;
	};
	stuQuery.prototype.before=function(t){
		var i,d,e,j;
		for(i = 0 ; i < this.length ; i++){
			d = document.createElement('div');
			d.innerHTML = t;
			e = d.childNodes;
			for(j = 0; j < e.length; j++) this[i].parentNode.insertBefore(e[j], this[i]);
		}
		return this;
	};
	stuQuery.prototype.after = function(t){
		for(var i = 0 ; i < this.length ; i++) this[i].insertAdjacentHTML('afterend', t);
		return this;
	};
	function NodeMatch(a,el){
		if(a && a.length > 0){
			for(var i = 0; i < a.length; i++){
				if(a[i].node == el) return {'success':true,'match':i};
			}
		}
		return {'success':false};
	}
	function storeEvents(e,event,fn,fn2,data){
		if(!eventcache[event]) eventcache[event] = [];
		eventcache[event].push({'node':e,'fn':fn,'fn2':fn2,'data':data});
	}
	function getEvent(e){
		if(eventcache[e.type]){
			var m = NodeMatch(eventcache[e.type],e.currentTarget);
			if(m.success){
				if(m.match.data) e.data = eventcache[e.type][m.match].data;
				return {'fn':eventcache[e.type][m.match].fn,'data':e};
			}
		}
		return function(){ return {'fn':''}; };
	}
	stuQuery.prototype.off = function(event){
		// Try to remove an event with attached data and supplied function, fn.

		// If the remove function doesn't exist, we make it
		if(typeof Element.prototype.removeEventListener !== "function"){
			Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
				if (!oListeners.hasOwnProperty(sEventType)) { return; }
				var oEvtListeners = oListeners[sEventType];
				for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
					if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
				}
				if (nElIdx === -1) { return; }
				for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
					if (aElListeners[iLstId] === fListener) { aElListeners.splice(iLstId, 1); }
				}
			};
		}
		for(var i = 0; i < this.length; i++){
			var m = NodeMatch(eventcache[event],this.e[i]);
			if(m.success){
				this[i].removeEventListener(event,eventcache[event][m.match].fn2,false);
				eventcache[event].splice(m.match,1);
			}
		}
		return this;
	};
	stuQuery.prototype.on = function(event,data,fn){
		// Add events
		var events = (event || window.event).split(/ /);
		if(typeof data==="function" && !fn){
			fn = data;
			data = "";
		}
		if(typeof fn !== "function") return this;

		if(this.length > 0){
			var _obj = this;
			var f;
			for(var ev = 0; ev < events.length; ev++){
				event = events[ev];
				f = function(b){
					var e = getEvent({'currentTarget':this,'type':event,'data':data,'originalEvent':b,'preventDefault':function(){ if(b.preventDefault) b.preventDefault(); },'stopPropagation':function(){
						if(b.stopImmediatePropagation) b.stopImmediatePropagation();
						if(b.stopPropagation) b.stopPropagation();
						if(b.cancelBubble!=null) b.cancelBubble = true;
					}});
					if(typeof e.fn === "function") return e.fn.call(_obj,e.data);
				};
				for(var i = 0; i < this.length; i++){
					storeEvents(this[i],event,fn,f,data);
					if(this[i].addEventListener) this[i].addEventListener(event, f, false); 
					else if(this[i].attachEvent) this[i].attachEvent(event, f);
				}
			}
		}
		return this;
	};
	stuQuery.prototype.trigger = function(e){
		var event; // The custom event that will be created
		var events = e.split(/ /);

		for(var ev = 0; ev < events.length; ev++){
			if(document.createEvent) {
				event = document.createEvent("HTMLEvents");
				event.initEvent(events[ev], true, true);
			}else{
				event = document.createEventObject();
				event.eventType = events[ev];
			}

			event.eventName = e;

			for(var i = 0 ;  i < this.length ; i++){
				if(document.createEvent) this[i].dispatchEvent(event);
				else this[i].fireEvent("on" + event.eventType, event);
			}
		}

		return this;
	};
	stuQuery.prototype.focus = function(){
		// If there is only one element, we trigger the focus event
		if(this.length == 1) this[0].focus();
		return this;
	};
	stuQuery.prototype.blur = function(){
		// If there is only one element, we trigger the blur event
		if(this.length == 1) this[0].blur();
		return this;
	};
	stuQuery.prototype.remove = function(){
		// Remove DOM elements
		if(this.length < 1) return this;
		for(var i = this.length-1; i >= 0; i--){
			if(!this[i]) return;
			if(typeof this[i].remove==="function") this[i].remove();
			else if(typeof this[i].parentElement.removeChild==="function") this[i].parentElement.removeChild(this[i]);
		}
		return this;
	};
	stuQuery.prototype.hasClass = function(cls){
		// Check if a DOM element has the specified class
		var result = true;
		for(var i = 0; i < this.length; i++){
			if(!this[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) result = false;
		}
		return result;
	};
	stuQuery.prototype.toggleClass = function(cls){
		// Toggle a class on a DOM element
		for(var i = 0; i < this.length; i++){
			if(this[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this[i].className = this[i].className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)", "g")," ").replace(/ $/,'');
			else this[i].className = (this[i].className+' '+cls).replace(/^ /,'');
		}
		return this;
	};
	stuQuery.prototype.addClass = function(cls){
		// Add a class on a DOM element
		for(var i = 0; i < this.length; i++){
			if(!this[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this[i].className = (this[i].className+' '+cls).replace(/^ /,'');
		}
		return this;
	};
	stuQuery.prototype.removeClass = function(cls){
		// Remove a class on a DOM element
		for(var i = 0; i < this.length; i++){
			while(this[i].className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"))) this[i].className = this[i].className.replace(new RegExp("(\\s|^)" + cls + "(\\s|$)", "g")," ").replace(/ $/,'').replace(/^ /,'');
		}
		return this;
	};
	stuQuery.prototype.css = function(css){
		var styles,i,key;
		if(this.length==1 && typeof css==="string"){
			styles = window.getComputedStyle(this[0]);
			return styles[css];
		}
		for(i = 0; i < this.length; i++){
			// Read the currently set style
			styles = {};
			var style = this[i].getAttribute('style');
			if(style){
				var bits = this[i].getAttribute('style').split(";");
				for(var b = 0; b < bits.length; b++){
					var pairs = bits[b].split(":");
					if(pairs.length==2) styles[pairs[0]] = pairs[1];
				}
			}
			if(typeof css==="object"){
				// Add the user-provided style to what was there
				for(key in css){
					if(typeof css[key]!=="undefined") styles[key] = css[key];
				}
				// Build the CSS string
				var newstyle = '';
				for(key in styles){
					if(typeof styles[key]!=="undefined"){
						if(newstyle) newstyle += ';';
						if(styles[key]) newstyle += key+':'+styles[key];
					}
				}
				// Update style
				this[i].setAttribute('style',newstyle);
			}
		}
		return this;
	};
	stuQuery.prototype.parent = function(){
		var tmp = [];
		for(var i = 0; i < this.length; i++) tmp.push(this[i].parentElement);
		return S(tmp);
	};
	stuQuery.prototype.children = function(c){
		var i;
		// Only look one level down
		if(typeof c==="string"){
			// We are using a selector
			var result = [];
			for(i = 0; i < this.length; i++){
				for(var ch = 0; ch < this[i].children.length; ch++){
					if(this.matchSelector(this[i].children[ch],c)) result.push(this[i].children[ch]);
				}
			}
			return S(result);
		}else{
			// We are using an index
			for(i = 0; i < this.length; i++) this[i] = (this[i].children.length > c ? this[i].children[c] : this[i]);
			return this;
		}
	};
	stuQuery.prototype.find = function(selector){
		var result = [];
		for(var i = 0; i < this.length; i++) result = result.concat(this.querySelector(this[i],selector));
		// Return a new instance of stuQuery
		return S(result);
	};
	function getset(s,attr,val,typs){
		var tmp = [];
		for(var i = 0; i < s.length; i++){
			tmp.push(s[i].getAttribute(attr));
			var ok = false;
			for(var j in typs){ if(typeof val===typs[j]) ok = true; }
			if(ok){
				if(val) s[i].setAttribute(attr,val);
				else s[i].removeAttribute(attr);
			}
		}
		if(tmp.length==1) tmp = tmp[0];
		if(typeof val==="undefined") return tmp;
		else return s;
	}
	stuQuery.prototype.attr = function(attr,val){
		return getset(this,attr,val,["string","number"]);
	};
	stuQuery.prototype.prop = function(attr,val){
		return getset(this,attr,val,["boolean"]);
	};
	stuQuery.prototype.clone = function(){
		var span = document.createElement('div');
		span.appendChild(this[0].cloneNode(true));
		return span.innerHTML;
	};
	stuQuery.prototype.replaceWith = function(html){
		var tempDiv;
		var clone = S(this.e);
		for(var i = 0; i < this.length; i++){
			tempDiv = document.createElement('div');
			tempDiv.innerHTML = html;
			clone[i] = tempDiv.cloneNode(true);
			this[i].parentNode.replaceChild(clone[i], this[i]);
		}
		return clone;
	};
	stuQuery.prototype.width = function(){
		if(this.length > 1) return;
		return this[0].offsetWidth;
	};
	stuQuery.prototype.height = function(){
		if(this.length > 1) return;
		return this[0].offsetHeight;
	};
	stuQuery.prototype.outerWidth = function(){
		if(this.length > 1) return;
		var s = getComputedStyle(this[0]);
		return this[0].offsetWidth + parseInt(s.marginLeft) + parseInt(s.marginRight);
	};
	stuQuery.prototype.outerHeight = function(){
		if(this.length > 1) return;
		var s = getComputedStyle(this[0]);
		return this[0].offsetHeight + parseInt(s.marginTop) + parseInt(s.marginBottom);
	};
	stuQuery.prototype.offset = function(){
		var rect = this[0].getBoundingClientRect();
	
		return {
		  top: rect.top + document.body.scrollTop,
		  left: rect.left + document.body.scrollLeft
		};
	};
	stuQuery.prototype.position = function(){
		if(this.length > 1) return;
		return {left: this[0].offsetLeft, top: this[0].offsetTop};
	};
	stuQuery.prototype.ajax = function(url,attrs){
		//=========================================================
		// ajax(url,{'complete':function,'error':function,'dataType':'json'})
		// complete: function - a function executed on completion
		// error: function - a function executed on an error
		// cache: break the cache
		// dataType: json - will convert the text to JSON
		//           jsonp - will add a callback function and convert the results to JSON

		if(typeof url!=="string") return false;
		if(!attrs) attrs = {};
		var cb = "",qs = "";
		var oReq,urlbits;
		// If part of the URL is query string we split that first
		if(url.indexOf("?") > 0){
			urlbits = url.split("?");
			if(urlbits.length){
				url = urlbits[0];
				qs = urlbits[1];
			}
		}
		if(attrs.dataType=="jsonp"){
			cb = 'fn_'+(new Date()).getTime();
			window[cb] = function(rsp){
				if(typeof attrs.success==="function") attrs.success.call((attrs['this'] ? attrs['this'] : this), rsp, attrs);
			};
		}
		if(typeof attrs.cache==="boolean" && !attrs.cache) qs += (qs ? '&':'')+(new Date()).valueOf();
		if(cb) qs += (qs ? '&':'')+'callback='+cb;
		if(attrs.data) qs += (qs ? '&':'')+attrs.data;

		// Build the URL to query
		if(attrs.method=="POST") attrs.url = url;
		else attrs.url = url+(qs ? '?'+qs:'');

		if(attrs.dataType=="jsonp"){
			var script = document.createElement('script');
			script.src = attrs.url;
			document.body.appendChild(script);
			return this;
		}

		// code for IE7+/Firefox/Chrome/Opera/Safari or for IE6/IE5
		oReq = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
		oReq.addEventListener("load", window[cb] || complete);
		oReq.addEventListener("error", error);
		oReq.addEventListener("progress", progress);
		var responseTypeAware = 'responseType' in oReq;
		if(attrs.beforeSend) oReq = attrs.beforeSend.call((attrs['this'] ? attrs['this'] : this), oReq, attrs);

		function complete(evt) {
			attrs.header = oReq.getAllResponseHeaders();
			var rsp;
			if(oReq.status == 200 || oReq.status == 201 || oReq.status == 202) {
				rsp = oReq.response;
				if(oReq.responseType=="" || oReq.responseType=="text") rsp = oReq.responseText;
				if(attrs.dataType=="json"){
					try {
						if(typeof rsp==="string") rsp = JSON.parse(rsp.replace(/[\n\r]/g,"\\n").replace(/^([^\(]+)\((.*)\)([^\)]*)$/,function(e,a,b,c){ return (a==cb) ? b:''; }).replace(/\\n/g,"\n"));
					} catch(e){ error(e); }
				}

				// Parse out content in the appropriate callback
				if(attrs.dataType=="script"){
					var fileref=document.createElement('script');
					fileref.setAttribute("type","text/javascript");
					fileref.innerHTML = rsp;
					document.head.appendChild(fileref);
				}
				attrs.statusText = 'success';
				if(typeof attrs.success==="function") attrs.success.call((attrs['this'] ? attrs['this'] : this), rsp, attrs);
			}else{
				attrs.statusText = 'error';
				error(evt);
			}
			if(typeof attrs.complete==="function") attrs.complete.call((attrs['this'] ? attrs['this'] : this), rsp, attrs);
		}

		function error(evt){
			if(typeof attrs.error==="function") attrs.error.call((attrs['this'] ? attrs['this'] : this),evt,attrs);
		}

		function progress(evt){
			if(typeof attrs.progress==="function") attrs.progress.call((attrs['this'] ? attrs['this'] : this),evt,attrs);
		}

		if(responseTypeAware && attrs.dataType){
			try { oReq.responseType = attrs.dataType; }
			catch(err){ error(err); }
		}

		try{ oReq.open((attrs.method||'GET'), attrs.url, true); }
		catch(err){ error(err); }

		if(attrs.method=="POST") oReq.setRequestHeader('Content-type','application/x-www-form-urlencoded');

		try{ oReq.send((attrs.method=="POST" ? qs : null)); }
		catch(err){ error(err); }

		return this;
	};
	stuQuery.prototype.loadJSON = function(url,fn,attrs){
		if(!attrs) attrs = {};
		attrs.dataType = "json";
		attrs.complete = fn;
		this.ajax(url,attrs);
		return this;
	};

	root.stuQuery = stuQuery;
	root.S = function(e){ return new stuQuery(e); };

})(window || this);

/*
	Stuquery SVG Builder
*/
function SVG(id,w,h){
	if(!id) return this;
	this.version = "0.1.6";
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
	
	var _obj = this;
	var counter = 0;
	
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
	var _obj = this;
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
		this.id = _obj.id+'-svg-node-'+counter;
		counter++;

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
			// Update the path on the element's "d" property
			if(a=="path") this.el.attr('d',(new Path(attr[a])).string());
			if(this.type=="text"){
				// Update any tspan elements' x position
				var tspan = this.el.find('tspan');
				for(var i = 0 ; i < tspan.length; i++) tspan[i].setAttribute('x',(this.attributes.x||this.x));
			}
		}
		this.orig.attributes = JSON.parse(JSON.stringify(this.attributes));
		
		// Set the ID if we've been given one
		var oldid = this.id+'';
		if(this.attributes && this.attributes['id']) this.id = this.attributes['id'];

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
						console.log('here',t)
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

	var _obj = this;

	function buildChunk(nodes,node){
		
		n = nodes[node];
		var chunk = "";
		var t = n.type;
		var arr = (n.text) ? n.text.split(/\n/) : [];
		
		if(n.type){
			chunk += '<'+t;
			// Update node with any transforms
			n.update();
			// Add properties
			for(var j in n){
				if(j != "type" && typeof n[j]!=="object" && typeof n[j]!=="function" && j != "attributes"){
					if(j=="text" && arr.length > 1) chunk += '';
					else chunk += ' '+j+'="'+n[j]+'"';
				}
			}
			chunk += ' id="'+n.id+'"';
			// Add attributes
			for(var a in n.attributes) chunk += ' '+a+'="'+(a == "clip-path" ? 'url(#':'')+n.attributes[a]+(a == "clip-path" ? ')':'')+'"';
			// Draw internal parts of a text element
			if(n.text){
				var y = 0;
				var lh = 1.2;
				chunk += '>';
				var off = -0.5 + arr.length*0.5;
				for(var a = 0; a < arr.length; a++, y+=lh){
					chunk += '<tspan'+(a==0 ? ' dy="-'+(lh*off)+'em"':' x="'+(n.attributes.x||n.x)+'" dy="'+lh+'em"')+'>'+arr[a]+'</tspan>';
				}
				chunk += '</'+t+'>';
			}else{
				chunk += ' />';
			}
		}
		return chunk;
	}

	// Build the SVG chunks for each node
	for(var i = 0; i < this.nodes.length; i++) dom += buildChunk(this.nodes,i);

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
	this.cache = {};

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
		e.data.me.setType(e.data.me.type,(e.data.me.type!=e.data.me.defaulttype ? true : false));
	});
	
	// Listen for resizing information
	window.addEventListener('message', function(event){
		_obj.iframe = event.data;
		_obj.positionBubble();
	}, false);

	this.positionBubble = function(){
		if(this.iframe && S('.infobubble').length > 0) S('.infobubble').css({'top':'calc('+(this.iframe.top > 0 ? this.iframe.top : 0)+'px + 1em)','max-height':(this.iframe.height)+'px'});
	}

	this.setType = function(t,update){

		// Have we changed type?
		if(t==this.by){
			console.log('no change');
			return this;
		}

		// Update the history
		if(this.pushstate) history.pushState({type:t},"Hexes",(update ? '?'+t : ''));

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
					this.setColours(type);
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

	// Add events to map
	this.hex.on('mouseover',{'builder':this},function(e){

		e.data.hexmap.regionFocus(e.data.region);

		if(S('#tooltip').length==0) S('#'+e.data.builder.id+'-inner').append('<div id="tooltip"></div>');
		var tooltip = S('#tooltip');
		tooltip.html(e.data.builder.hex.hexes[e.data.region].attributes.title+'</div>');
		var bb = e.data.builder.hex.hexes[e.data.region].el[0].getBoundingClientRect();
		tooltip.css({'position':'absolute','left':''+Math.round(bb.left+(bb.width/2)-S('#'+e.data.builder.id)[0].offsetLeft)+'px','top':''+Math.round(bb.y+bb.height+window.scrollY-S('#'+e.data.builder.id)[0].offsetTop)+'px'});

	}).on('mouseout',{'builder':this},function(e){

		e.data.hexmap.regionBlur(e.data.region);
		S('#tooltip').remove();

	}).on('click',{'builder':this},function(e){

		e.data.builder.openActive(e.data.region);

	});
	
	this.closeActive = function(){
		this.hex.selected = "";
		this.hex.selectRegion('');
		S('.infobubble').remove();
		S('body').removeClass('modal');
		return this;
	}
	
	this.openActive = function(region){
		
		var previous = this.hex.selected;
		var current = region;
		if(this.hex.search.active) this.hex.search.toggle();

		this.label(region,previous!=current);
		this.hex.selectRegion(region);

		return this;
	}

	this.label = function(region,reopen){

		var view = this.views[this.by];
		if(!view) return this;
		var popup = view.popup;

		var title = this.hex.hexes[region].el[0].getAttribute('title');

		if(reopen){
			S('.infobubble').remove();
			S('#'+this.id+'').after('<div class="infobubble generalelection"><div class="infobubble_inner"><div class="spinner"><svg width="64" height="64" viewBox="-32 -32 64 64" xmlns="http://www.w3.org/2000/svg" style="transform-origin: center center;"><style>#odilogo-starburst rect2 { transform-origin: center center; -webkit-transform-origin: center center; }</style><g id="odilogo-starburst"><rect width="4" height="25" x="-2" transform="rotate(7)" fill="#2254F4"><animate attributeName="height" begin="0s" dur="4s" values="25;19;23;29;26;25;31;21;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(27)" fill="#F9BC26"><animate attributeName="height" begin="0s" dur="2s" values="25;29;23;20;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(47)" fill="#00B6FF"><animate attributeName="height" begin="0s" dur="1s" values="25;20;27;25;" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(67)" fill="#D60303"><animate attributeName="height" begin="0s" dur="5s" values="25;15;27;25;32;16;24;27;18;32;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(87)" fill="#722EA5"><animate attributeName="height" begin="0s" dur="6s" values="25;19;26;30;21;24;29;27;15;23;20;29;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(107)" fill="#1DD3A7"><animate attributeName="height" begin="0s" dur="3s" values="25;27;24;32;23;19;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(127)" fill="#EF3AAB"><animate attributeName="height" begin="0s" dur="2s" values="25;20;22;32;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(147)" fill="#FF6700"><animate attributeName="height" begin="0s" dur="4s" values="25;24;18;23;27;23;29;21;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(167)" fill="#0DBC37"><animate attributeName="height" begin="0s" dur="4s" values="25;15;27;25;24;32;16;24;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(187)" fill="#178CFF"><animate attributeName="height" begin="0s" dur="5s" values="25;18;23;21;31;20;24;21;28;31;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(207)" fill="#722EA5"><animate attributeName="height" begin="0s" dur="3s" values="25;32;16;24;19;27;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(227)" fill="#D73058"><animate attributeName="height" begin="0s" dur="5s" values="25;23;25;28;18;27;24;30;31;28;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(247)" fill="#00B6FF"><animate attributeName="height" begin="0s" dur="4s" values="25;19;23;29;26;25;31;21;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(267)" fill="#67E767"><animate attributeName="height" begin="0s" dur="2s" values="25;29;23;20;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(287)" fill="#E6007C"><animate attributeName="height" begin="0s" dur="1s" values="25;20;27;25;" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(307)" fill="#0DBC37"><animate attributeName="height" begin="0s" dur="5s" values="25;15;27;25;32;16;24;27;18;32;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(327)" fill="#D60303"><animate attributeName="height" begin="0s" dur="6s" values="25;19;26;30;21;24;29;27;15;23;20;29;25" calcMode="linear" repeatCount="indefinite" /></rect><rect width="4" height="25" x="-2" transform="rotate(347)" fill="#08DEF9"><animate attributeName="height" begin="0s" dur="3s" values="25;27;24;32;23;19;25" calcMode="linear" repeatCount="indefinite" /></rect></g><g id="odilogo"><circle cx="-12.8" cy="0" r="6.4" style="fill:black;"></circle><path d="M-7 -6.4 l 6.4 0 c 0 0 6.4 0 6.4 6.4 c 0 6.4 -6.4 6.4 -6.4 6.4 L -7 6.4Z" style="fill:black;"></path><rect width="6.4" height="12.5" x="5.5" y="-6.25" style="fill:black;"></rect></g></svg></div></div></div>');
		}

		function callback(title,region,data,attr){

			// Check if we should update the popup or not
			var date = "";
			var timestamp = "";
			attr.header.replace(/last-modified: (.*)/,function(m,p1){ date = p1; });
			if(date){
				date = new Date(date);
				timestamp = date.getUTCHours()+':'+date.getUTCMinutes();
			}
			if(this.cache[region] == timestamp && S('.infobubble_inner .spinner').length==0){
				console.info('Constituency results unchanged since '+timestamp);
				return this;
			}else{
				this.cache[region] = timestamp;
				attr.timestamp = timestamp;
			}

			var lbl = this.hex.mapping.hexes[region].label;
			var l = {};
			if(popup && typeof popup.render==="function"){
				l = popup.render.call(this,title,region,data,attr);
			}else{
				console.warn('No view for '+this.by);
				l = {'label':title,'class':cls,'color':''};
			}
			var c = (l.color||'');
			var t = (l.color ? setTextColor(c) : 'black');
			var txt = l.label;
			txt = txt.replace(/%COLOR%/g,t);
			S('.infobubble_inner').html(txt).css({'width':(l.w ? l.w+'px':''),'height':(l.h ? l.h+'px':'')});
			S('.infobubble').attr('class','infobubble'+(l['class'] ? " "+l['class'] : ''));
			S('.infobubble .close').remove();
			S('.infobubble').prepend('<button class="close button" title="Close constituency information">&times;</button>');
			S('.infobubble .close').on('click',{me:this},function(e){ e.data.me.closeActive(); });
			if(typeof l.callback==="function") l.callback.call(this,title,region,data,attr);
			return this;
		}
		// May need to load data first
		if(popup.file){
			// Load data from a file
			console.info('Loading data for '+region,popup.file.replace(/%region%/g,region));
			S().ajax(popup.file.replace(/%region%/g,region),{
				'this': this,
				'callback': callback,
				'dataType':(popup.file.indexOf(".json") > 0 ? 'json':'text'),
				'region': region,
				'cache': (typeof popup.live==="boolean" ? !popup.live : true),
				'render': popup.render,
				'title': title,
				'success': function(d,attr){
					// Convert to JSON if CSV
					if(attr.dataType=="text") d = CSV2JSON(d);
					this.positionBubble();
					if(typeof attr.callback==="function") attr.callback.call(this,attr.title,attr.region,d,attr);
				},
				'error': function(e,attr){
					console.error('Unable to load '+attr.url);
					if(typeof attr.callback==="function") attr.callback.call(this,attr.title,attr.region);
				}
			});
		}else{
			callback.call(this,title,region);
		}
		
		S('body').addClass('modal');

		return this;
	}

	// Add events to buttons for colour changing
	S('.view-toggle').on('change',{me:this},function(e){
		e.data.me.setType(document.querySelector('input[name="view"]:checked').id,true);
	});

	S(document).on('keypress',function(e){
		//if(e.originalEvent.charCode==109) S('#savesvg').trigger('click');     // M
		//if(e.originalEvent.charCode==104) S('#save').trigger('click');     // H
	});
	

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
					// Process the data
					attr.process.call(this,attr.type,[]);
					if(typeof attr.callback==="function") attr.callback.call(this,attr.type);
				}
			});
			
		}
		return this;
	}

	this.setColours = function(type){
		if(!type) type = "";
		
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

		// Re-render the popup?
		if(this.hex.selected) this.label(this.hex.selected); //re-render

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


	// Start of colour code

	function d2h(d) { return ((d < 16) ? "0" : "")+d.toString(16);}
	function h2d(h) {return parseInt(h,16);}

	// Define colour routines
	function Colour(c,n){
		if(!c) return {};

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
	function getColour(pc,a,b){
		if(!b) b = a;
		return 'rgb('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+')';
	}
	function makeGradient(a,b){
		if(!b) b = a;
		return 'background: '+a.hex+'; background: -moz-linear-gradient(left, '+a.hex+' 0%, '+b.hex+' 100%);background: -webkit-linear-gradient(left, '+a.hex+' 0%,'+b.hex+' 100%);background: linear-gradient(to right, '+a.hex+' 0%,'+b.hex+' 100%);';
	}
	function setTextColor(hex){
		if(!hex) return '';
		var colour = new Colour(hex);
		hex = colour.hex;
		var L1 = getL(hex);
		var Lb = getL('#000000');
		var Lw = getL('#ffffff');
		var rb = (Math.max(L1, Lb) + 0.05) / (Math.min(L1, Lb) + 0.05);
		var rw = (Math.max(L1, Lw) + 0.05) / (Math.min(L1, Lw) + 0.05);
		if(L1 == Lw) return '#000000';
		return (rb > rw ? '#000000':'#FFFFFF');
	}
	function getL(c) {
		return (0.2126 * getsRGB(c.substr(1, 2)) + 0.7152 * getsRGB(c.substr(3, 2)) + 0.0722 * getsRGB(c.substr(-2)));
	}
	function getRGB(c) {
		try { var c = parseInt(c, 16); } catch (err) { var c = false; }
		return c;
	}
	function getsRGB(c) {
		c = getRGB(c) / 255;
		c = (c <= 0.03928) ? c / 12.92 : Math.pow(((c + 0.055) / 1.055), 2.4);
		return c;
	}

	return this;

}
