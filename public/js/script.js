function interactiveDman(elem) {
	/**
	 * @type {HTMLImageElement}
	 */
	var dman = elem;
	var mask = new Image();
	mask.src = "/img/dman1_mask.png";

	var canvas = document.createElement("canvas");
	/**
	 * @type {CanvasRenderingContext2D}
	 */
	var context;
	var loaded = false;
	var w = 1;
	var registered = false;

	function distSq(x1, y1, x2, y2) {
		return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
	}

	function adjustEye(obj, mx, my, max) {
		var d = distSq(obj.x, obj.y, mx, my);
		var dx = mx - obj.x;
		var dy = my - obj.y;

		if (d >= max * max) {
			var ds = Math.sqrt(d);
			obj.x += dx / ds * max;
			obj.y += dy / ds * max;
		} else {
			obj.x = mx;
			obj.y = my;
		}
	}

	function updateEyes(mx, my) {
		if (!registered) {
			document.addEventListener("mousemove", function (event) {
				updateEyes(event.clientX, event.clientY);
			});
			document.addEventListener("resize", function (event) {
				updateEyes();
			});
			registered = true;
		}

		context.globalCompositeOperation = "lighten";
		context.drawImage(mask, 0, 0, canvas.width, canvas.height);

		var left = {
			x: canvas.width / 2 + 3 * w,
			y: canvas.height / 4 - 2 * w
		};

		var right = {
			x: canvas.width / 2 + 20 * w,
			y: canvas.height / 4
		};

		var rect = canvas.getBoundingClientRect();

		if (!isFinite(mx))
			mx = rect.right;
		if (!isFinite(my))
			my = rect.bottom;

		mx -= rect.x || rect.left;
		my -= rect.y || rect.top;

		left.x = left.x / canvas.width * rect.width;
		right.x = right.x / canvas.width * rect.width;
		left.y = left.y / canvas.width * rect.width * 0.9;
		right.y = right.y / canvas.width * rect.width * 0.9;

		let r = 4 * w / canvas.width * rect.width;

		adjustEye(left, mx, my, r);
		adjustEye(right, mx, my, r);

		left.x = left.x / rect.width * canvas.width;
		right.x = right.x / rect.width * canvas.width;
		left.y = left.y / 0.9 / rect.width * canvas.width;
		right.y = right.y / 0.9 / rect.width * canvas.width;

		context.globalCompositeOperation = "source-over";
		context.beginPath();
		context.ellipse(left.x, left.y, 4 * w, 7 * w, 0.3, 0, Math.PI * 2, false);
		context.fill();
		context.beginPath();
		context.ellipse(right.x, right.y, 4 * w, 7 * w, 0.3, 0, Math.PI * 2, false);
		context.fill();
	}

	mask.addEventListener("load", function () {
		if (context)
			updateEyes();
		else
			loaded = true;
	});

	dman.addEventListener("load", function () {
		canvas.width = dman.naturalWidth;
		canvas.height = dman.naturalHeight;
		context = canvas.getContext("2d");
		w = canvas.width / 100;

		dman.parentElement.insertBefore(canvas, dman);
		dman.style.display = "none";

		context.drawImage(dman, 0, 0, canvas.width, canvas.height);

		if (loaded)
			updateEyes();
	});
}

interactiveDman(document.getElementById("dman1"));
var dmans = document.querySelectorAll(".followdman");
for (var i = 0; i < dmans.length; i++)
	interactiveDman(dmans[i]);
