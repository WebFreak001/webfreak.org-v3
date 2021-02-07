function interactiveDman(elem) {
	/**
	 * @type {HTMLImageElement}
	 */
	var dman = elem;
	var mask = new Image();
	mask.src = "/img/dman1_mask.png";

	var petGif = new Image();
	petGif.src = "/img/pet.png";
	var gifFrames = 9;

	var canvas = document.createElement("canvas");
	/**
	 * @type {CanvasRenderingContext2D}
	 */
	var context;
	var loaded = false;
	var gifOffset = -50;
	var gifSize = 112;
	var w = 1;
	var registered = false;
	var petStats = undefined;

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

	var clickTimeout;
	var drawingBlocked = false;
	var queuedClicks = 0;
	var lastMX = NaN, lastMY = NaN;

	function resetCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(dman, 0, 0, canvas.width, canvas.height);
	}

	function drawBase() {
		context.globalCompositeOperation = "lighten";
		context.drawImage(mask, 0, 0, canvas.width, canvas.height);
		context.globalCompositeOperation = "source-over";
	}

	function getEyes() {
		var left = {
			x: canvas.width / 2 + 3 * w,
			y: canvas.height / 4 - 2 * w
		};

		var right = {
			x: canvas.width / 2 + 20 * w,
			y: canvas.height / 4
		};

		return {
			left: left,
			right: right
		}
	}

	function updateEyes(mx, my) {
		if (!registered) {
			canvas.addEventListener("mousedown", function (event) {
				if (petStats === undefined)
					petStats = makePetStats(canvas);
				petStats.performPet();

				if (drawingBlocked) {
					queuedClicks++;
					return;
				}

				drawingBlocked = true;
				clearTimeout(clickTimeout);
				drawClickAnimation(0, function () {
					drawingBlocked = false;
					resetCanvas();
					updateEyes();
				});
			});

			document.addEventListener("mousemove", function (event) {
				updateEyes(event.clientX, event.clientY);
			});
			document.addEventListener("resize", function (event) {
				updateEyes();
			});
			registered = true;
		}

		if (mx === undefined)
			mx = lastMX;
		else
			lastMX = mx;

		if (my === undefined)
			my = lastMY;
		else
			lastMY = my;

		if (drawingBlocked)
			return;

		drawBase();

		var rect = canvas.getBoundingClientRect();
		var eyes = getEyes();

		if (!isFinite(mx))
			mx = rect.right;
		if (!isFinite(my))
			my = rect.bottom;

		eyes.left.x = eyes.left.x / canvas.width * rect.width;
		eyes.right.x = eyes.right.x / canvas.width * rect.width;
		eyes.left.y = eyes.left.y / canvas.width * rect.width * 0.9;
		eyes.right.y = eyes.right.y / canvas.width * rect.width * 0.9;

		mx -= rect.x || rect.left;
		my -= rect.y || rect.top;

		let r = 4 * w / canvas.width * rect.width;

		adjustEye(eyes.left, mx, my, r);
		adjustEye(eyes.right, mx, my, r);

		eyes.left.x = eyes.left.x / rect.width * canvas.width;
		eyes.right.x = eyes.right.x / rect.width * canvas.width;
		eyes.left.y = eyes.left.y / 0.9 / rect.width * canvas.width;
		eyes.right.y = eyes.right.y / 0.9 / rect.width * canvas.width;

		context.beginPath();
		context.ellipse(eyes.left.x, eyes.left.y, 4 * w, 7 * w, 0.3, 0, Math.PI * 2, false);
		context.fill();
		context.beginPath();
		context.ellipse(eyes.right.x, eyes.right.y, 4 * w, 7 * w, 0.3, 0, Math.PI * 2, false);
		context.fill();
	}

	function drawClickAnimation(frame, cb) {
		var eyes = getEyes();

		// context.beginPath();
		// context.ellipse(eyes.left.x, eyes.left.y, 4 * w, 7 * w, 0.3, 0, Math.PI * 2, false);
		// context.fill();
		// context.beginPath();
		// context.ellipse(eyes.right.x, eyes.right.y, 4 * w, 7 * w, 0.3, 0, Math.PI * 2, false);
		// context.fill();

		var r = w;

		resetCanvas();
		drawBase();

		context.beginPath();
		context.moveTo(eyes.left.x - 1 * r, eyes.left.y - 8 * r); // top
		context.lineTo(eyes.left.x + 7 * r, eyes.left.y); // right
		context.lineTo(eyes.left.x - 5 * r, eyes.left.y + 8 * r); // bottom
		context.lineTo(eyes.left.x - 7 * r, eyes.left.y + 6 * r); // bottom
		context.lineTo(eyes.left.x + 2 * r, eyes.left.y); // right
		context.lineTo(eyes.left.x - 3 * r, eyes.left.y - 6 * r); // top
		context.fill();

		context.beginPath();
		context.moveTo(eyes.right.x + 4 * r, eyes.right.y - 8 * r); // top
		context.lineTo(eyes.right.x - 6 * r, eyes.right.y - 1 * r); // left
		context.lineTo(eyes.right.x + 1 * r, eyes.right.y + 7 * r); // bottom
		context.lineTo(eyes.right.x + 4 * r, eyes.right.y + 5 * r); // bottom
		context.lineTo(eyes.right.x - 1 * r, eyes.right.y - 1 * r); // left
		context.lineTo(eyes.right.x + 6 * r, eyes.right.y - 6 * r); // top
		context.fill();

		if (petGif.complete) {
			context.drawImage(petGif, frame * gifSize + 1, 0, gifSize - 2, gifSize, 0, gifOffset, canvas.width, canvas.height);

			if (frame + 1 < gifFrames)
				setTimeout(function () { drawClickAnimation(frame + 1, cb); }, queuedClicks > 0 ? 20 / queuedClicks : 20);
			else if (queuedClicks > 0) {
				setTimeout(function () { drawClickAnimation(0, cb); }, queuedClicks > 0 ? 20 / queuedClicks : 20);
				queuedClicks--;
			} else {
				cb();
			}
		} else {
			setTimeout(cb, 500);
		}
	}

	mask.addEventListener("load", function () {
		if (context)
			updateEyes();
		else
			loaded = true;
	});
	if (mask.complete) loaded = true;

	var onLoaded = function () {
		canvas.width = dman.naturalWidth;
		canvas.height = dman.naturalHeight;
		context = canvas.getContext("2d");
		w = canvas.width / 100;

		dman.parentElement.insertBefore(canvas, dman);
		dman.style.display = "none";

		context.drawImage(dman, 0, 0, canvas.width, canvas.height);

		if (loaded)
			updateEyes();
	};

	if (dman.complete) onLoaded();
	else dman.addEventListener("load", onLoaded);
}

/** @type {WebSocket} */
var globalPetConnection = undefined;
var connectCallbacks = [];
var disconnectCallbacks = [];
var updateCallbacks = [];
var globalNum = BigInt(0);
var localOffset = 0;
var sendClicks = 0;
var clickTimeout = null;

if (!window.BigInt)
	window.BigInt = parseInt;

function waitForPetConnection(cb) {
	if (cb)
		connectCallbacks.push(cb);

	if (globalPetConnection)
	{
		if (!globalPetConnection || globalPetConnection.readyState != WebSocket.OPEN) return false;
		if (cb)
			cb(currentTmp);
		return true;
	}

	globalPetConnection = new WebSocket("wss://dman.wants.pet/ws");
	globalPetConnection.binaryType = 'arraybuffer';
	globalPetConnection.onmessage = function (m) {
		globalNum = window.BigInt64Array ? new BigInt64Array(m.data)[0] : BigInt(new Int32Array(m.data)[0]);
		localOffset = sendClicks;
		petUpdate();
	}
	globalPetConnection.onopen = function (m) {
		for (var i = 0; i < connectCallbacks.length; i++) {
			connectCallbacks[i](currentTmp);
		}
	}
	globalPetConnection.onclose = function () {
		globalPetConnection = null;
		for (var i = 0; i < connectCallbacks.length; i++) {
			disconnectCallbacks[i]();
		}
		setTimeout(waitForPetConnection, 1000);
	}

	return false;
}

function doGlobalPet() {
	waitForPetConnection();
	if (!globalPetConnection) return;
	localOffset++;
	sendClicks++;
	petUpdate();
	if (clickTimeout === null) {
		clickTimeout = setTimeout(function () {
			clickTimeout = null;
			if (!globalPetConnection || globalPetConnection.readyState != WebSocket.OPEN) return;
			var sent = sendClicks;
			var v = new Int8Array(1);
			v[0] = sendClicks;
			sendClicks = 0;
			globalPetConnection.send(v);
		}, 100);
	}
}


var currentTmp = BigInt(0);
var goal = BigInt(0);
function petUpdate() {
	var n = globalNum + BigInt(localOffset);

	goal = n;
	if (currentTmp + BigInt(100) < goal)
		currentTmp = goal;
	else if (currentTmp < goal) {
		var diff = goal - currentTmp;
		var delay = 1;
		if (diff >= 50)
			delay = 2;
		else if (diff >= 30)
			delay = 5;
		else if (diff >= 15)
			delay = 10;
		else
			delay = 40;
		currentTmp++;
		if (currentTmp < goal)
			setTimeout(petUpdate, 2 * delay + Math.random() * delay);
	}

	for (var i = 0; i < connectCallbacks.length; i++) {
		updateCallbacks[i](currentTmp);
	}
}

function makePetStats(canvas) {
	var rect = canvas.getBoundingClientRect();
	var info = document.createElement("div");
	info.className = "pettingInfo";
	info.style.display = "none";
	document.body.appendChild(info);
	var counterWrapper = document.createElement("p");
	var counter = document.createElement("span");
	counter.textContent = "0";
	counterWrapper.appendChild(counter);
	counterWrapper.appendChild(document.createTextNode(" pets"));
	var globalWrapper = document.createElement("p");
	globalWrapper.style.display = "none";
	var link = document.createElement("a");
	link.href = "https://dman.wants.pet";
	link.textContent = "dman.wants.pet";
	globalWrapper.appendChild(link);
	globalWrapper.appendChild(document.createTextNode(": "));
	var globalCounter = document.createElement("span");
	globalCounter.textContent = "0";
	globalWrapper.appendChild(globalCounter);
	info.appendChild(counterWrapper);
	info.appendChild(globalWrapper);

	var hideTimeout;
	function show() {
		info.style.left = ((rect.x || rect.left) + window.scrollX) + "px";
		info.style.top = ((rect.y || rect.top) + rect.height + window.scrollY) + "px";
		info.style.width = rect.width + "px";
		info.style.display = "";
	}
	function hide() {
		info.style.display = "none";
	}

	var localClicks = 0;
	disconnectCallbacks.push(function () { globalWrapper.style.display = "none"; });
	updateCallbacks.push(function (global) {
		globalCounter.textContent = global;
	});
	waitForPetConnection(function (global) {
		globalWrapper.style.display = "";
		globalCounter.textContent = global;
	});

	function doClick() {
		show();
		localClicks++;
		counter.textContent = localClicks;
		doGlobalPet();
		clearTimeout(hideTimeout);
		hideTimeout = setTimeout(hide, 6000);
	}

	return {
		performPet: doClick
	};
}

interactiveDman(document.getElementById("dman1"));
var dmans = document.querySelectorAll(".followdman");
for (var i = 0; i < dmans.length; i++)
	interactiveDman(dmans[i]);
