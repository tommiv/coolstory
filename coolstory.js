(function() {
	Array.prototype.forEach = Array.prototype.forEach || function(callback, ctx) {
		ctx = ctx || this;
		for (var i = 0; i < this.length; i++) {
			callback.call(ctx, this[i], i);
		};
	};


	// #todo: cross-browser
	// use raphael or abandon it
	var coolstory = function(svg, canvas, options) {
		// Init
		var self = this;

		options = $.extend({
			targetFPS  : 60,
			mode       : "auto", // auto|semi|manual
			group      : false,
			duration   : 1000,
			stroke     : "#000",
			strokewidth: 1,
			fill       : "none"
		}, options || {});
		options.mode = options.mode.match(/^auto|semi|manual$/i) ? options.mode.toLowerCase() : "auto";

		svg = svg[0] || svg;
		var src   = svg.contentDocument || svg.getSVGDocument();
		if (!src) {
			alert("BOO");
		};

		var root  = src.children[0]; // should be a root <svg> if document has right syntax
		var paper = Raphael(canvas, options.width, options.height);

		var renderQueue  = [];
		var renderGroups = [];

		var overall = 0; // Path counters for progress calc
		var drawn   = 0;

		// Helpers
	    var frame = 
			window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(callback, element) {
				window.setTimeout(callback, 1000 / 60);
			};

		var anim = function(graph) {
			var attr = {
				stroke        : graph.getAttribute("stroke") || options.stroke,
				"stroke-width": graph.getAttribute("stroke-width") || options.strokewidth
			};

			var duration = parseInt(graph.getAttribute("cs-duration") || options.duration);

			var path    = paper.path(graph.getAttribute("d")).attr(attr).node;
			var length  = path.getTotalLength();
			var frames  = Math.ceil(duration / 1000 * options.targetFPS);
			var pointer = 0;

			path.style.strokeDasharray  = length + ' ' + length; 
			path.style.strokeDashoffset = length;

			function render(){
				var progress = pointer / frames;
			 	if (progress < 1) {
					pointer++;
					path.style.strokeDashoffset = Math.floor(length * (1 - progress));
					return true;
				} else {
					path.style.fill = graph.getAttribute("fill") || options.fill;
					return false;
				};
			};
			renderQueue.push(render);
		};

		var assignGroup = function() {
			var group = renderGroups.shift();
			if (group) {
				renderQueue = [];
				group.forEach(anim);
				return true;
			} else {
				return false;
			};
		};

		// Compile
		var groups = [];
		var autogrouping = options.group == "auto";
		[].forEach.call(root.children, function(node, i) {
			var gid = autogrouping ? i : parseInt(node.getAttribute("cs-anim-group") || 0);
			switch (node.tagName.toLowerCase()) {
				case "path":
					if (groups[gid]) {
						groups[gid].push(node);
					} else {
						groups[gid] = [node];
					};
					overall++;
				break;
				case "g":
					var group = groups[gid] || [];
					[].forEach.call(root.querySelectorAll("path"), function(elem, i) {
						group.push(elem);
					});
					groups[gid] = group;
				break;
			};
		});

		// this removes gaps between groups for the great justice
		for (var i = 0; i < groups.length; i++) {
			if (groups[i] && groups[i].length) {
				renderGroups.push(groups[i]);
			};
		};

		if (!renderGroups.length) {
			console.error("No available paths");
			return false;
		} else {
			assignGroup();
		};

		// Drawing logic
		function draw() {
			var idx = 0, renderer = null;
			while (renderer = renderQueue[idx]) {
				if (renderer()) {
					idx++;
				} else {
					renderQueue.splice(idx, 1);
					drawn++;
				};
			};
		};

		// auto mode
		function mainloop() {
			draw();
			if (renderQueue.length || assignGroup()) {
				frame(mainloop, paper);
			} else { 
				options.oncomplete && options.oncomplete(self);
			};
		};

		// semi-auto mode
		function nextgroup(progress) {
			var intprog = drawn / overall;
			if (intprog > 1)
				return options.oncomplete && options.oncomplete(self);
			else if (intprog >= progress)
				return;

			draw();
			if (renderQueue.length || assignGroup()) {
				frame(function() {
					nextgroup(progress);
				}, paper);
			};
		};

		// manual mode #warn: no oncomplete callback
		function dragdelta(delta) {
			frame(function() {
				var steps = Math.ceil(delta / 20); // this is a magic number #todo: play with it 
				for (var i = 0; i < steps; i++) {
					draw();
					renderQueue.length || assignGroup();
				};
			}, paper);
		};

		// Run
		switch (options.mode) {
			case "manual":
				this.reportDelta = dragdelta;
			break;
			
			case "semi":
				this.reportProgress = nextgroup;
			break;
			
			case "auto":
			default:
				self.reportDelta = function() {
					console.warn("SC in auto mode, you should not report delta");
					self.reportDelta = function() {};
				};
				window.setTimeout(mainloop, 0);
			break;
		};
		return this;
	};

	window.coolstory = coolstory;
})();