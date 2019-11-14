/* @license
Papa Parse
v5.1.0
https://github.com/mholt/PapaParse
License: MIT
*/
!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof module&&"undefined"!=typeof exports?module.exports=t():e.Papa=t()}(this,function s(){"use strict";var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=n&&/blob:/i.test((f.location||{}).protocol),a={},h=0,b={parse:function(e,t){var r=(t=t||{}).dynamicTyping||!1;q(r)&&(t.dynamicTypingFunction=r,r={});if(t.dynamicTyping=r,t.transform=!!q(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var i=function(){if(!b.WORKERS_SUPPORTED)return!1;var e=(r=f.URL||f.webkitURL||null,i=s.toString(),b.BLOB_URL||(b.BLOB_URL=r.createObjectURL(new Blob(["(",i,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var r,i;return t.onmessage=_,t.id=h++,a[t.id]=t}();return i.userStep=t.step,i.userChunk=t.chunk,i.userComplete=t.complete,i.userError=t.error,t.step=q(t.step),t.chunk=q(t.chunk),t.complete=q(t.complete),t.error=q(t.error),delete t.worker,void i.postMessage({input:e,config:t,workerId:i.id})}var n=null;b.NODE_STREAM_INPUT,"string"==typeof e?n=t.download?new l(t):new p(t):!0===e.readable&&q(e.read)&&q(e.on)?n=new m(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,_=!0,g=",",v="\r\n",s='"',a=s+s,r=!1,i=null;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return-1!==t.delimiter.indexOf(e)}).length||(g=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(r=t.skipEmptyLines);"string"==typeof t.newline&&(v=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(_=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");i=t.columns}void 0!==t.escapeChar&&(a=t.escapeChar+s)}();var o=new RegExp(U(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return u(null,e,r);if("object"==typeof e[0])return u(i||h(e[0]),e,r)}else if("object"==typeof e)return"string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:h(e.data[0])),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),u(e.fields||[],e.data||[],r);throw new Error("Unable to serialize unrecognized input");function h(e){if("object"!=typeof e)return[];var t=[];for(var r in e)t.push(r);return t}function u(e,t,r){var i="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(i+=g),i+=y(e[a],a);0<t.length&&(i+=v)}for(var o=0;o<t.length;o++){var h=n?e.length:t[o].length,u=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(r&&!n&&(u="greedy"===r?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===r&&n){for(var d=[],l=0;l<h;l++){var c=s?e[l]:l;d.push(t[o][c])}u=""===d.join("").trim()}if(!u){for(var p=0;p<h;p++){0<p&&!f&&(i+=g);var m=n&&s?e[p]:p;i+=y(t[o][m],p)}o<t.length-1&&(!r||0<h&&!f)&&(i+=v)}}return i}function y(e,t){if(null==e)return"";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);var r=e.toString().replace(o,a),i="boolean"==typeof n&&n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var r=0;r<t.length;r++)if(-1<e.indexOf(t[r]))return!0;return!1}(r,b.BAD_DELIMITERS)||-1<r.indexOf(g)||" "===r.charAt(0)||" "===r.charAt(r.length-1);return i?s+r+s:r}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=E,b.ParserHandle=r,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=m,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var r=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return!0;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},r)})}),e(),this;function e(){if(0!==h.length){var e,t,r,i,n=h[0];if(q(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,r=n.inputElem,i=s.reason,void(q(o.error)&&o.error({name:e},t,r,i));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config))}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){q(a)&&a(e,n.file,n.inputElem),u()},b.parse(n.file,n.instanceConfig)}else q(o.complete)&&o.complete()}function u(){h.splice(0,1),e()}}}function u(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=w(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new r(t),(this._handle.streamer=this)._config=t}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&q(this._config.beforeFirstChunk)){var r=this._config.beforeFirstChunk(e);void 0!==r&&(e=r)}this.isFirstChunk=!1,this._halted=!1;var i=this._partialLine+e;this._partialLine="";var n=this._handle.parse(i,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=i.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(q(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!q(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0},this._sendError=function(e){q(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1})}}function l(e){var i;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),u.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded()}:function(){this._readChunk()},this.stream=function(e){this._input=e,this._nextChunk()},this._readChunk=function(){if(this._finished)this._chunkLoaded();else{if(i=new XMLHttpRequest,this._config.withCredentials&&(i.withCredentials=this._config.withCredentials),n||(i.onload=y(this._chunkLoaded,this),i.onerror=y(this._chunkError,this)),i.open("GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)i.setRequestHeader(t,e[t])}if(this._config.chunkSize){var r=this._start+this._config.chunkSize-1;i.setRequestHeader("Range","bytes="+this._start+"-"+r)}try{i.send()}catch(e){this._chunkError(e.message)}n&&0===i.status&&this._chunkError()}},this._chunkLoaded=function(){4===i.readyState&&(i.status<200||400<=i.status?this._chunkError():(this._start+=i.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return-1;return parseInt(t.substr(t.lastIndexOf("/")+1))}(i),this.parseChunk(i.responseText)))},this._chunkError=function(e){var t=i.statusText||e;this._sendError(new Error(t))}}function c(e){var i,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),u.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((i=new FileReader).onload=y(this._chunkLoaded,this),i.onerror=y(this._chunkError,this)):i=new FileReaderSync,this._nextChunk()},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk()},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t)}var r=i.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:r}})},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result)},this._chunkError=function(){this._sendError(i.error)}}function p(e){var r;u.call(this,e=e||{}),this.stream=function(e){return r=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e=this._config.chunkSize,t=e?r.substr(0,e):r;return r=e?r.substr(e):"",this._finished=!r,this.parseChunk(t)}}}function m(e){u.call(this,e=e||{});var t=[],r=!0,i=!1;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause()},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume()},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError)},this._checkIsFinished=function(){i&&1===t.length&&(this._finished=!0)},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):r=!0},this._streamData=y(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),r&&(r=!1,this._checkIsFinished(),this.parseChunk(t.shift()))}catch(e){this._streamError(e)}},this),this._streamError=y(function(e){this._streamCleanUp(),this._sendError(e)},this),this._streamEnd=y(function(){this._streamCleanUp(),i=!0,this._streamData("")},this),this._streamCleanUp=y(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError)},this)}function r(g){var a,o,h,i=Math.pow(2,53),n=-i,s=/^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i,u=/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/,t=this,r=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(q(g.step)){var p=g.step;g.step=function(e){if(c=e,_())m();else{if(m(),0===c.data.length)return;r+=e.data.length,g.preview&&r>g.preview?o.abort():p(c,t)}}}function v(e){return"greedy"===g.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function m(){if(c&&h&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),h=!1),g.skipEmptyLines)for(var e=0;e<c.data.length;e++)v(c.data[e])&&c.data.splice(e--,1);return _()&&function(){if(!c)return;function e(e){q(g.transformHeader)&&(e=g.transformHeader(e)),l.push(e)}if(Array.isArray(c.data[0])){for(var t=0;_()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1)}else c.data.forEach(e)}(),function(){if(!c||!g.header&&!g.dynamicTyping&&!g.transform)return c;function e(e,t){var r,i=g.header?{}:[];for(r=0;r<e.length;r++){var n=r,s=e[r];g.header&&(n=r>=l.length?"__parsed_extra":l[r]),g.transform&&(s=g.transform(s,n)),s=y(n,s),"__parsed_extra"===n?(i[n]=i[n]||[],i[n].push(s)):i[n]=s}return g.header&&(r>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+r,f+t):r<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+r,f+t)),i}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);g.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function _(){return g.header&&0===l.length}function y(e,t){return r=e,g.dynamicTypingFunction&&void 0===g.dynamicTyping[r]&&(g.dynamicTyping[r]=g.dynamicTypingFunction(r)),!0===(g.dynamicTyping[r]||g.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<i)return!0}return!1}(t)?parseFloat(t):u.test(t)?new Date(t):""===t?null:t):t;var r}function k(e,t,r,i){c.errors.push({type:e,code:t,message:r,row:i})}this.parse=function(e,t,r){var i=g.quoteChar||'"';if(g.newline||(g.newline=function(e,t){e=e.substr(0,1048576);var r=new RegExp(U(t)+"([^]*?)"+U(t),"gm"),i=(e=e.replace(r,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<i[0].length;if(1===i.length||s)return"\n";for(var a=0,o=0;o<i.length;o++)"\n"===i[o][0]&&a++;return a>=i.length/2?"\r\n":"\r"}(e,i)),h=!1,g.delimiter)q(g.delimiter)&&(g.delimiter=g.delimiter(e),c.meta.delimiter=g.delimiter);else{var n=function(e,t,r,i,n){var s,a,o,h;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var u=0;u<n.length;u++){var f=n[u],d=0,l=0,c=0;o=void 0;for(var p=new E({comments:i,delimiter:f,newline:t,preview:10}).parse(e),m=0;m<p.data.length;m++)if(r&&v(p.data[m]))c++;else{var _=p.data[m].length;l+=_,void 0!==o?0<_&&(d+=Math.abs(_-o),o=_):o=_}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===h||h<l)&&1.99<l&&(a=d,s=f,h=l)}return{successful:!!(g.delimiter=s),bestDelimiter:s}}(e,g.newline,g.skipEmptyLines,g.comments,g.delimitersToGuess);n.successful?g.delimiter=n.bestDelimiter:(h=!0,g.delimiter=b.DefaultDelimiter),c.meta.delimiter=g.delimiter}var s=w(g);return g.preview&&g.header&&s.preview++,a=e,o=new E(s),c=o.parse(a,t,r),m(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=a.substr(o.getCharIndex())},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(this.resume,3)},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,q(g.complete)&&g.complete(c),a=""}}function U(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(e){var O,D=(e=e||{}).delimiter,I=e.newline,T=e.comments,A=e.step,L=e.preview,F=e.fastMode,M=O=void 0===e.quoteChar?'"':e.quoteChar;if(void 0!==e.escapeChar&&(M=e.escapeChar),("string"!=typeof D||-1<b.BAD_DELIMITERS.indexOf(D))&&(D=","),T===D)throw new Error("Comment character same as delimiter");!0===T?T="#":("string"!=typeof T||-1<b.BAD_DELIMITERS.indexOf(T))&&(T=!1),"\n"!==I&&"\r"!==I&&"\r\n"!==I&&(I="\n");var z=0,j=!1;this.parse=function(a,r,t){if("string"!=typeof a)throw new Error("Input must be a string");var i=a.length,e=D.length,n=I.length,s=T.length,o=q(A),h=[],u=[],f=[],d=z=0;if(!a)return R();if(F||!1!==F&&-1===a.indexOf(O)){for(var l=a.split(I),c=0;c<l.length;c++){if(f=l[c],z+=f.length,c!==l.length-1)z+=I.length;else if(t)return R();if(!T||f.substr(0,s)!==T){if(o){if(h=[],b(f.split(D)),S(),j)return R()}else b(f.split(D));if(L&&L<=c)return h=h.slice(0,L),R(!0)}}return R()}for(var p=a.indexOf(D,z),m=a.indexOf(I,z),_=new RegExp(U(M)+U(O),"g"),g=a.indexOf(O,z);;)if(a[z]!==O)if(T&&0===f.length&&a.substr(z,s)===T){if(-1===m)return R();z=m+n,m=a.indexOf(I,z),p=a.indexOf(D,z)}else{if(-1!==p&&(p<m||-1===m)){if(!(p<g)){f.push(a.substring(z,p)),z=p+e,p=a.indexOf(D,z);continue}var v=x(p,g,m);if(v&&void 0!==v.nextDelim){p=v.nextDelim,g=v.quoteSearch,f.push(a.substring(z,p)),z=p+e,p=a.indexOf(D,z);continue}}if(-1===m)break;if(f.push(a.substring(z,m)),C(m+n),o&&(S(),j))return R();if(L&&h.length>=L)return R(!0)}else for(g=z,z++;;){if(-1===(g=a.indexOf(O,g+1)))return t||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:z}),w();if(g===i-1)return w(a.substring(z,g).replace(_,O));if(O!==M||a[g+1]!==M){if(O===M||0===g||a[g-1]!==M){var y=E(-1===m?p:Math.min(p,m));if(a[g+1+y]===D){f.push(a.substring(z,g).replace(_,O)),a[z=g+1+y+e]!==O&&(g=a.indexOf(O,z)),p=a.indexOf(D,z),m=a.indexOf(I,z);break}var k=E(m);if(a.substr(g+1+k,n)===I){if(f.push(a.substring(z,g).replace(_,O)),C(g+1+k+n),p=a.indexOf(D,z),g=a.indexOf(O,z),o&&(S(),j))return R();if(L&&h.length>=L)return R(!0);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:z}),g++}}else g++}return w();function b(e){h.push(e),d=z}function E(e){var t=0;if(-1!==e){var r=a.substring(g+1,e);r&&""===r.trim()&&(t=r.length)}return t}function w(e){return t||(void 0===e&&(e=a.substr(z)),f.push(e),z=i,b(f),o&&S()),R()}function C(e){z=e,b(f),f=[],m=a.indexOf(I,z)}function R(e,t){return{data:t||!1?h[0]:h,errors:u,meta:{delimiter:D,linebreak:I,aborted:j,truncated:!!e,cursor:d+(r||0)}}}function S(){A(R(void 0,!0)),h=[],u=[]}function x(e,t,r){var i={nextDelim:void 0,quoteSearch:void 0},n=a.indexOf(O,t+1);if(t<e&&e<n&&(n<r||-1===r)){var s=a.indexOf(D,n);if(-1===s)return i;n<s&&(n=a.indexOf(O,n+1)),i=x(s,n,r)}else i={nextDelim:e,quoteSearch:t};return i}},this.abort=function(){j=!0},this.getCharIndex=function(){return z}}function _(e){var t=e.data,r=a[t.workerId],i=!1;if(t.error)r.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){i=!0,g(t.workerId,{data:[],errors:[],meta:{aborted:!0}})},pause:v,resume:v};if(q(r.userStep)){for(var s=0;s<t.results.data.length&&(r.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!i);s++);delete t.results}else q(r.userChunk)&&(r.userChunk(t.results,n,t.file),delete t.results)}t.finished&&!i&&g(t.workerId,t.results)}function g(e,t){var r=a[e];q(r.userComplete)&&r.userComplete(t),r.terminate(),delete a[e]}function v(){throw new Error("Not implemented.")}function w(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var r in e)t[r]=w(e[r]);return t}function y(e,t){return function(){e.apply(t,arguments)}}function q(e){return"function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var r=b.parse(t.input,t.config);r&&f.postMessage({workerId:b.WORKER_ID,results:r,finished:!0})}}),(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(u.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(m.prototype=Object.create(u.prototype)).constructor=m,b});

function Constituencies(id,w,h,padding,file){

	this.w = w;
	this.h = h;
	this.aspectratio = w/h;
	this.id = id;
	this.type = S('#data-selector')[0].value;
	this.defaulttype = this.type;

	// Use the search string to pick a parameter to display
	var t = location.search.replace(/\?/,"");
	if(t){
		// Check if this is in the list
		var options = S('#data-selector option');
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
	}

	// Create a hex map
	this.hex = new HexMap({'id':id,'width':w,'height':h,'size':16,'padding':padding});

	// Do we update the address bar?
	this.pushstate = !!(window.history && history.pushState);

	// Add "back" button functionality
	var _obj = this;
	if(this.pushstate){
		window[(this.pushstate) ? 'onpopstate' : 'onhashchange'] = function(e){
			if(e.state && e.state.type) _obj.setColours(e.state.type);
			else _obj.setColours(_obj.defaulttype)
		};
	}

	this.hex.load(file,{me:this},function(e){
		e.data.me.setType(e.data.me.type);
	});
	
	this.setType = function(t){
		// Update the history
		if(this.pushstate) history.pushState({type:t},"Hexes",(t==this.defaulttype ? '' : '?'+t));

		// Set the colours
		this.setColours(t);
		
		return this;
	}

	function getLabel(e,title){
		var rs = {'SC':'Scotland','NI':'Northern Ireland','WA':'Wales','NE':'North East','NW':'North West','YH':'Yorkshire &amp; Humber','WM':'West Midlands','EM':'East Midlands','EA':'East Anglia','LO':'London','SE':'South East','SW':'South West'};
		var lbl = e.data.hexmap.mapping.hexes[e.data.region].label;
		var cls = "";
		if(e.data.builder.by == "population"){
			lbl = title+'<br />Population: '+(e.data.pop||0);
		}else if(e.data.builder.by == "electorate"){
			lbl = title+'<br />Electorate: '+e.data.electorate;
		}else if(e.data.builder.by == "GE2015-results"){
			lbl = title+'<br />Party: '+e.data.hexmap.data['GE2015-results'][e.data.region];
		}else if(e.data.builder.by == "GE2017-results"){
			r = e.data.hexmap.data['constituency-card'][e.data.region];
			cls = "generalelection";
			lbl = '<div><img src="'+r['photo_url']+'" /></div><div><strong>'+title+'</strong><br /><strong>MP:</strong> <a href="'+r['mysocuri']+'">'+r['dispname']+'</a>, '+r['partynow']+'<br /><strong>Area:</strong> '+r['sq_km']+'km&sup2; ('+r['sq_mi']+' miles&sup2;)<br /><strong>Distance from power:</strong> '+r['km_fr_pow']+' km ('+r['mi_fr_pow']+' miles)'+(r['result17'] ? '<br /><strong>2017 turnout:</strong> '+r['turnout17']+'% ('+r['valid17']+'/'+r['elect17']+')<table><tr></tr></table>' : '')+'</div>';
		}else if(e.data.builder.by == "GE2017-turnout"){
			r = e.data.hexmap.data['constituency-card'][e.data.region];
			cls = "generalelection";
			lbl = '<div><img src="'+r['photo_url']+'" /></div><div><strong>'+title+'</strong><br /><strong>MP:</strong> <a href="'+r['mysocuri']+'">'+r['dispname']+'</a>, '+r['partynow']+'<br /><strong>Area:</strong> '+r['sq_km']+'km&sup2; ('+r['sq_mi']+' miles&sup2;)<br /><strong>Distance from power:</strong> '+r['km_fr_pow']+' km ('+r['mi_fr_pow']+' miles)'+(r['result17'] ? '<br /><strong>2017 turnout:</strong> '+r['turnout17']+'% ('+r['valid17']+'/'+r['elect17']+')<table><tr></tr></table>' : '')+'</div>';
		}else if(e.data.builder.by == "referendum"){
			lbl = title+'<br />Estimated leave vote: '+(e.data.hexmap.data['referendum'][e.data.region] ? Math.round(e.data.hexmap.data['referendum'][e.data.region]*100)+'%':'unknown');
		}else if(e.data.builder.by == "benefits"){
			lbl = '<strong>'+title+'</strong><br />Percentage of constituency on income-based<br />benefits (IS/JSA/ESA): <strong>'+(e.data.hexmap.data['benefits'][e.data.region] ? (parseFloat(e.data.hexmap.data['benefits'][e.data.region]).toFixed(2))+'%':'unknown')+'</strong>';
		}else if(e.data.builder.by == "GE2017-candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['GE2017-candidates'][e.data.region];
			for(var i = 0; i < c.length; i++){
				lbl += '<br /><strong><!--<a href="https://candidates.democracyclub.org.uk/person/'+c[i].i+'">-->'+c[i].n+'<!--</a>--></strong> - '+c[i].p;
			}
		}else if(e.data.builder.by == "GE2019-candidates"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data['GE2019-candidates'][e.data.region];
			if(c){
				for(var i = 0; i < c.length; i++){
					lbl += '<br /><strong>'+(c[i].id ? '<a href="https://candidates.democracyclub.org.uk/person/'+c[i].id+'">'+c[i].name+'</a>':c[i].name)+'</strong> - '+c[i].party_name;
				}
			}
			lbl += '<br /><div style="font-size:0.8em;color:#999;margin-top:16px;border-top:1px solid black;">Missing candidates? <a href="https://candidates.democracyclub.org.uk/election/parl.2019-12-12/post/WMC:'+e.data.region+'">Add them to Democracy Club.</a></div>'
		}else if(e.data.builder.by == "GE2017-gender" || e.data.builder.by == "GE2019-gender"){
			lbl = '<span style="border-bottom:1px solid #333;margin-bottom:0.25em;display:inline-block;">'+title+'</span>';
			var c = e.data.hexmap.data[e.data.builder.by][e.data.region];
			for(var i = 0; i < c.length; i++){
				if(c[i].g) lbl += '<br /><strong>'+c[i].n+'</strong> - '+c[i].p+' ('+(c[i].g.toLowerCase()=="f" ? "Female" : (c[i].g.toLowerCase()=="m" ? "Male": (c[i].g ? "Diverse":"Unknown")))+')';
				if(c[i].gender) lbl += '<br /><strong>'+c[i].name+'</strong> - '+c[i].party_name+' ('+(c[i].gender.toLowerCase()=="female" ? "Female" : (c[i].gender.toLowerCase()=="male" ? "Male": (c[i].gender ? "Diverse":"Unknown")))+')';
			}
		}else lbl = title+'<br />Region: '+rs[e.data.hexmap.mapping.hexes[e.data.region].a];
		return {'label':lbl,'class':cls};
	}
	this.hex.on('mouseover',{'builder':this},function(e){
		this.attr('fill-opacity',0.75).attr('stroke-width',4.5);
		// Simulate a change of z-index by moving this element to the end of the SVG
		this.parent()[0].appendChild(this[0]);
	}).on('mouseout',function(e){
		this.attr('fill-opacity',0.5).attr('stroke-width',1.5);
	}).on('click',{'builder':this},function(e){
		if(e.data.builder.by=="GE2017-candidates"){
			location.href = "https://candidates.democracyclub.org.uk/election/parl.2017-06-08/post/WMC:"+e.data.region+"/";
		}else{
			var previous = e.data.hexmap.selected;
			var current = e.data.region;
			if(previous && current == previous) e.data.hexmap.regionToggleSelected(previous,true);
			else e.data.hexmap.selectRegion(e.data.region);
			if(!e.data.hexmap.selected) S('.infobubble').remove();
			else e.data.builder.label(e,this.attr('title'));
		}
	});

	this.label = function(e,title){
		l = getLabel(e,title);
		if(S('.infobubble').length == 0) S('#'+this.id+'').after('<div class="infobubble"><div class="infobubble_inner"></div></div>');
		S('.infobubble_inner').html(l.label).css({'width':(l.w ? l.w+'px':''),'height':(l.h ? l.h+'px':'')});
		S('.infobubble').attr('class','infobubble'+(l['class'] ? ' '+l['class'] : ''));
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

	// Add events to buttons for colour changing
	S('#data-selector').on('change',{me:this},function(e){
		e.data.me.setType(e.currentTarget.selectedOptions[0].getAttribute('value'));
		S(e.currentTarget).removeClass('c10-bg').addClass('b5-bg');
		S(e.currentTarget.selectedOptions[0]).addClass('c10-bg').removeClass('b5-bg');
	});

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
		if(!type) type = "GE2015-results";

		if(!this.data) this.data = {};
		this.data[type] = {};
		if(!this.hex.data) this.hex.data = {};
		this.hex.data[type] = {};

		function tidyGender(person){
			var g = "";
			if(person.g) g = person.g;
			if(person.gender) g = person.gender;

			if(g){
				if(g.toLowerCase()=="m" || g.toLowerCase()=="male") g = "male";
				else if(g.toLowerCase()=="f" || g.toLowerCase()=="female" || g.toLowerCase()=="femal") g = "female";
				else if(g.toLowerCase()=="non-binary") g = "non-binary";
				else if(g.toLowerCase()=="non-binary") g = "transgender";
				else{
					console.info((person.n||person.name)+' given gender: '+g);
				}
			}else{
				//console.warn('No gender given for '+(person.n||person.name),person);
			}
			person.gender = g;
			return person;				
		}


		if(type == "referendum"){
			S().ajax('../data/2016referendum-estimates.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = parseFloat(c[1]);
					}
					this.hex.data[type] = this.data[type];
					this.setColours("referendum");
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		}else if(type == "GE2017-candidates" || type == "GE2017-gender"){
			S().ajax('../data/2017ge-candidates.json',{
				'type': type,
				'complete':function(d,attr){
					for(var pcd in d){
						for(var i = 0; i < d[pcd].length; i++){
							d[pcd][i] = tidyGender(d[pcd][i]);
						}
					}

					this.data["GE2017-candidates"] = d;
					this.hex.data["GE2017-candidates"] = this.data["GE2017-candidates"];
					this.setColours("GE2017-candidates");




					this.data["GE2017-gender"] = d;
					this.hex.data["GE2017-gender"] = this.data["GE2017-gender"];
					this.setColours(attr['type']);
				},
				'this': this,
				'error':function(){},
				'dataType':'json'
			});
		}else if(type == "benefits"){
			S().ajax('../data/2017benefits.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/g,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data[type][c[0]] = c[8];
					}
					this.hex.data[type] = this.data[type];
					this.setColours("benefits");
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		}else if(type == "constituency-card" || type == "GE2017-results" || type == "GE2017-turnout"){
			S().ajax('https://raw.githubusercontent.com/alasdairrae/wpc/master/files/wpc_2019_flat_file_v9.csv',{
				'complete':function(d){
					var data = CSV2JSON(d);
					this.data['constituency-card'] = {};
					this.data['GE2017-turnout'] = {};
					this.data['GE2017-results'] = {};
					for(var i = 0; i < data.length; i++){
						this.data['constituency-card'][data[i]['ccode1']] = JSON.parse(JSON.stringify(data[i]));
						this.data['GE2017-results'][data[i]['ccode1']] = data[i]['first17'];
						this.data['GE2017-turnout'][data[i]['ccode1']] = data[i]['turnout17'];
					}
					this.hex.data['GE2017-results'] = this.data['GE2017-results'];
					this.hex.data['GE2017-turnout'] = this.data['GE2017-turnout'];
					this.hex.data['constituency-card'] = this.data['constituency-card'];
					this.setColours(type);
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		}else if(type == "GE2019-candidates" || type == "GE2019-gender"){
			S().ajax('https://candidates.democracyclub.org.uk/media/candidates-parl.2019-12-12.csv',{
				'this': this,
				'type':type,
				'dataType':'text',
				'success':function(d,attr){
					var data = CSV2JSON(d);
					this.data['GE2019-candidates'] = {};
					for(var i = 0; i < data.length; i++){
						// We need a valid post_id to be set
						if(data[i].post_id && data[i].post_id.indexOf("WMC")>=0){
							pcd = data[i].post_id.replace(/^.*\:/,"");
							data[i] = tidyGender(data[i]);
							if(!this.data['GE2019-candidates'][pcd]) this.data['GE2019-candidates'][pcd] = [];
							this.data['GE2019-candidates'][pcd].push(JSON.parse(JSON.stringify(data[i])));
							if(!this.data['GE2019-gender'][pcd]) this.data['GE2019-gender'][pcd] = [];
							this.data['GE2019-gender'][pcd].push(JSON.parse(JSON.stringify(data[i])));
						}
					}
					this.hex.data['GE2019-candidates'] = this.data['GE2019-candidates'];
					this.hex.data['GE2019-gender'] = this.data['GE2019-gender'];
					this.setColours(attr['type']);
				},
				'error':function(e,attr){
					console.error('Unable to load '+attr.file );
				}
			});
		}else{
			S().ajax('../data/2015results.csv',{
				'complete':function(d){
					if(typeof d==="string"){
						d = d.replace(/\r/,'');
						d = d.split(/[\n]/);
					}
					for(var i = 1; i < d.length; i++){
						c = d[i].split(/,/);
						this.data['GE2015-results'][c[0]] = c[1];
					}
					this.hex.data['GE2015-results'] = this.data['GE2015-results'];
					this.setColours("GE2015-results");
				},
				'this': this,
				'error':function(){},
				'dataType':'text'
			});
		
		}
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

		S('#data-selector')[0].value = type;

		this.by = type;
		if(type == "GE2015-results" && (!this.data || !this.data["GE2015-results"])) return this.loadResults("GE2015-results");
		if(type == "GE2017-results" && (!this.data || !this.data["constituency-card"])) return this.loadResults("GE2017-results");
		if(type == "GE2017-turnout" && (!this.data || !this.data["constituency-card"])) return this.loadResults("GE2017-turnout");
		if(type == "referendum" && (!this.data || !this.data["referendum"])) return this.loadResults("referendum");
		if(type == "GE2017-candidates" && (!this.data || !this.data["GE2017-candidates"])) return this.loadResults("GE2017-candidates");
		if(type == "GE2017-gender" && (!this.data || !this.data["GE2017-gender"])) return this.loadResults("GE2017-gender");
		if(type == "GE2019-candidates" && (!this.data || !this.data["GE2019-candidates"])) return this.loadResults("GE2019-candidates");
		if(type == "GE2019-gender" && (!this.data || !this.data["GE2019-gender"])) return this.loadResults("GE2019-gender");
		if(type == "benefits" && (!this.data || !this.data["benefits"])) return this.loadResults("benefits");

		var key = "";
		var names = {'Con':'Conservative','Lab':'Labour','LD':'Lib Dem','PC':'Plaid Cymru','Ind':'Independent','Spk':'Speaker'};
		var p = {'Con':'#2254F4','Lab':'#D60303','LD':'#faa61a','SNP':'#fdf38e','PC':'#1DD3A7','UKIP':'#470A65','Green':'#0DBC37','DUP':'#4f4c9a','SDLP':'#fbb675','SF':'#b6c727','UUP':'#EF3AAB','Ind':'#dfdfdf','Spk':'#909090'};

		// Set the function for changing the colours
		if(type == "population"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var min = 25000;
			var max = 150000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].p - min)/(max-min);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+min+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+max;
		}else if(type == "electorate"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var mine = 50000;
			var maxe = 80000;
			this.hex.setColours = function(region){
				var value = (this.mapping.hexes[region].e - mine)/(maxe-mine);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+mine+'<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+maxe;
		}else if(type == "GE2015-results"){
			this.hex.setColours = function(region){
				r = this.data["GE2015-results"][region].replace(/[\n\r]/g,"");
				return (p[r] || '#000');
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}else if(type == "GE2017-results"){
			this.hex.setColours = function(region){
				r = this.data["GE2017-results"][region];
				if(r) r = r.replace(/[\n\r]/g,"");
				else console.warning('No region',r,region,p[r]);
				return (p[r] || '#000');
			}
			for(var party in p){
				key += '<span style="background-color:'+p[party]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[party] || party);
			}
		}else if(type == "GE2017-turnout"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#D60303');
			var mine = 40;
			var maxe = 80;
			this.hex.setColours = function(region){
				var value = (this.data["GE2017-turnout"][region] - mine)/(maxe-mine);
				if(value < 0) value = 0;
				if(value > 1) value = 1;
				return getColour(value,a,b);
			};
			key = '&le;'+mine+'%<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>&ge;'+maxe+'%';
		}else if(type == "referendum"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#2254F4');
			this.hex.setColours = function(region){
				return getColour(1 - (this.data["referendum"][region]-0.2)/0.6,a,b);
			}
			key = 'leave<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>remain';
		}else if(type == "benefits"){
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			this.hex.setColours = function(region){
				if(this.data["benefits"][region]) return getColour(Math.min(1,(this.data["benefits"][region])/10),a,b);
				else return '';
			}
			key = 'Percentage of constituency on income-based benefits (IS/JSA/ESA)<br />0%<span style="'+makeGradient(a,b)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>10%+';
		}else if(type == "GE2017-candidates"){
			var levels = {0:'#2254F4',1:'#178CFF',2:'#00B6FF',3:'#08DEF9',4:'#1DD3A7',5:'#67E767',6:'#F9BC26'};
			this.hex.setColours = function(region){
				var n = this.data["GE2017-candidates"][region].length;
				var c = '#2254F4';
				if(n > 0) c = (levels[n] || levels[6]);
				return c;
			}
			key = '0';
			for(var n in levels){
				key += '<span style="background-color:'+levels[n]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>';
			}
			key += '&ge;6';
		}else if(type == "GE2019-candidates"){
			var levels = {0:'#2254F4',1:'#178CFF',2:'#00B6FF',3:'#08DEF9',4:'#1DD3A7',5:'#67E767',6:'#F9BC26'};
			this.hex.setColours = function(region){
				var n = 0;
				var c = '#2254F4';
				if(this.data["GE2019-candidates"][region]){
					n = this.data["GE2019-candidates"][region].length;
				}
				if(n > 0) c = (levels[n] || levels[6]);
				return c;
			}
			key = '0';
			for(var n in levels){
				key += '<span style="background-color:'+levels[n]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>';
			}
			key += '&ge;6';
		}else if(type == "GE2017-gender" || type == "GE2019-gender"){
			var c = new Colour('#0DBC37');
			var b = new Colour('#F9BC26');
			var a = new Colour('#722EA5');
			this.hex.setColours = function(region){
				var m = 0;
				var f = 0;
				var o = 0;
				var n = 0;
				var u = 0;
				if(this.data[type][region]){
					for(var i = 0; i < this.data[type][region].length; i++){
						if(this.data[type][region][i].gender){
							if(this.data[type][region][i].gender=="female") f++;
							else if(this.data[type][region][i].gender=="male") m++;
							else if(this.data[type][region][i].gender=="non-binary") n++;
							else u++;
						}else{
							o++;
						}
					}
				}else{
					console.warn('No data for '+pcd);
					this.data[type][region] = {};
				}
				if(n > 0) console.info(n+' non-binary '+(n == 1 ? 'person':'people')+' in '+region,this.data[type][region])
				if(u > 0) console.warn('Diverse gender for '+region,this.data[type][region])
				var t = m + f;
				this.data[type][region].ratio = (t > 0 ? ((m+0.5*o)/(m+f+o)) : 0.5);
				return getColour(this.data[type][region].ratio,a,c);
			}
			key = 'The gender-split of candidates in each constituency<br />male<span style="'+makeGradient(c,a)+';width: 10em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>female';

		}else if(type == "region"){
			var names = {'YH':'Yorkshire and Humber','EM':'East Midlands','WM':'West Midlands','EA':'East Anglia','NI':'Northern Ireland','WA':'Wales','NW':'North West','NE':'North East','SE':'South East','SW':'South West','SC':'Scotland','LO':'London'};
			var rs = {'YH':'#F9BC26','EM':'#00B6FF','WM':'#E6007C','EA':'#FF6700','SC':'#2254F4','NI':'#722EA5','WA':'#0DBC37','NW':'#1DD3A7','NE':'#D60303','SW':'#178CFF','LO':'#D73058','SE':'#67E767'};
			this.hex.setColours = function(region){
				var r = this.mapping.hexes[region].a;
				return (rs[r] || this.colour.on);
			}
			for(var r in rs){
				key += '<span style="background-color:'+rs[r]+';width: 1em; height: 1em;opacity: 0.7;display: inline-block;margin: 0 0.25em;"></span>'+(names[r] || r);
			}
		}
		
		S('#key').html((key ? key:''));

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
