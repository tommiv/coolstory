$(function() {
	var get = function(id) { return document.getElementById(id); };

	get("svg-source").onload = function() {
		var reqmode = window.location.search.split("?").pop();
		var mode = reqmode.indexOf("semi") >= 0 ? "semi" : reqmode.indexOf("manual") >= 0 ? "manual" : "auto";

		var opt = {
			mode       : mode,
			width      : 700,
			height     : 650,
			group      : "auto",
			stroke     : "white",
			strokewidth: 2
		};

		var canvas = get("canvas");
		var win = $(window);
		var height = $(document).height();
		var winscroll = win.scrollTop();

		switch (mode) {
			case "auto":
				opt.duration = 100;
				var cs = new coolstory(this, canvas, opt);
				var inth = window.setInterval(function() {
					win.scrollTop(winscroll = winscroll + 30);
					if (winscroll >= height) {
						window.clearInterval(inth);
					};
				}, 16/1000);
			break;

			case "semi":
				opt.duration = 700;
				var cs = new coolstory(this, canvas, opt);
				win.on("scroll", function(e) {
					cs.reportProgress(win.scrollTop() / height);
				});
			break;

			case "manual":
				opt.duration = 200;
				var cs = new coolstory(this, canvas, opt);
				win.on("scroll", function(e) {
					var newscroll = win.scrollTop();
					var delta = newscroll - winscroll;
					winscroll = newscroll;
					if (delta > 0) {
						cs.reportDelta(delta);
					};
				});
			break;
		};
	};
});