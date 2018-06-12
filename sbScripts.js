var p1Ship;
var asteroids = [];
var explosions = [];
var lasers = [];
var level = 1;
var dps = 1;
var killCount = 0;

var w = 1150;
var h = 600;

var play = 0; //0 is unstarted, 1 is play, 2 is pause, 3 is game over, 4 is next level

var keysDown = [];

//load images
//player is loaded in onLoad because we're using HTML for it

var asteroidImg = new Image();
asteroidImg.src = "images/asteroid.png";

var pauseImg = new Image();
pauseImg.src = "images/pause.png";

var startScreenImg = new Image();
startScreenImg.src = "images/startScreen.png";

var gameOverImg = new Image();
gameOverImg.src = "images/gameOver.png";

var waitLevelImg = new Image();
waitLevelImg.src = "images/waitLevel.png";

var laserImg = new Image();
laserImg.src = "images/laser.png";

var explosionImg = new Image();
explosionImg.src = "images/explosion.png";

function makeShip(lives, x, y, width, height, angle, speed) {
	var ship = {
		lives: lives,
		width: width,
		height: height,
		angle: angle,
		x: x,
		y: y,
		speed: speed,
		visibility: true,

		setVisible: function(isVisible) {
			this.visibility = isVisible;
		},

		getVisible: function() {
			return this.visibility;
		},

		damage: function() {
			this.lives--;
			document.getElementById("sLives").textContent = this.lives;
			if (this.lives <= 0) {
				//player died
				endLevel();
			}
		},

		getLives: function() {
			return this.lives;
		},
	};
	return ship;
}

function makeAsteroid(x, y, width, height, speed, angle) { //asteroids constantly rotating
	var asteroid = {
		width: width,
		height: height,
		x: x,
		y: y,
		speed: speed,
		angle: angle,
		visibility: true,
		size: 1, //how many times have we broken? fraction, so 1 is 100% of an asteroid
		maxSize: (Math.floor((width * height) / 8000)), //how many times til we die? usually @2 unless too small

		changeProperties: function(width, height, speed, angle) {
			this.width = width;
			this.height = height;
			this.speed = speed;
			this.angle = angle;
		},

		setVisible: function(isVisible) {
			this.visibility = isVisible;
			if (this.visibility == false) {
				//let's move us off the screen
				this.x = w + 100;
			}
		},

		getVisible: function() {
			return this.visibility;
		},

		getSize: function() {
			return this.size;
		},

		setMaxSize: function(size) {
			this.maxSize = size;
		},

		getMaxSize: function() {
			return this.maxSize;
		},

		incrementSize: function() {
			this.size++;
		},

	};
	return asteroid;
}

function makeLaser(x, y, angle) {
	var laser = {
		x: x,
		y: y,
		speed: 15,
		angle: angle,
		width: 15,
		height: 15,
		visibility: true,

		setVisible: function(isVisible) {
			this.visibility = isVisible;
			if (this.visibility == false) {
				//go away
				//let's move us off the screen
				this.x = w + 100;
			}
		},

		getVisible: function() {
			return this.visibility;
		},
	}
	return laser;
}

function makeExplosion(x, y, width, height) {
	var explosion = {
		x: x,
		y: y,
		width: width,
		height: height,
		timer: 0,
		visibility: true,

		incrementTimer: function(w) {
			//increase our timer by 1, if it's reached 2, we should not be visible anymore
			this.timer++;
			if (this.timer >= 4) {
				this.visibility = false;
				this.x = w + 100;
			}
		},

		getVisible: function() {
			return this.visibility;
		},
	}

	return explosion;
}

function breakAsteroid(asteroid) {
	asteroid.incrementSize(); //ok, let's break by 1
	if (asteroid.getSize() >= asteroid.getMaxSize()) {
		//we've already broken too many times, time to destroy us
		asteroid.setVisible(false);
		killCount++;
		document.getElementById("sKillCount").textContent = killCount;
	}
	else {
		//we haven't broken too many times, let's split
		//switch up the properties of our current one, making it smaller, and create a new asteroid
		//adding asteroid to the end
		var newAsteroid = makeAsteroid(asteroid.x, asteroid.x, (asteroid.width / 4) + (Math.random() * (asteroid.width / 2)), (asteroid.height / 4) + (Math.random() * (asteroid.height / 2)), 1 + (Math.random() * 5), Math.random() * 360);
		newAsteroid.setMaxSize(2);
		asteroids.push(newAsteroid);
		asteroid.changeProperties(asteroid.width / 2, asteroid.height / 2, 1 + (Math.random() * 5), Math.random() * 360);
	}
}

function asteroidsDead() {
	var deadAsteroids = 0;
	for (var i = 0; i < asteroids.length; i++) {
		if (!asteroids[i].getVisible()) {
			//we're not visible, so either dead or inconsequential
			deadAsteroids++;
		}
	}
	if (deadAsteroids == asteroids.length) {
		//they're all dead
		nextLevel();
	}
}

function toRadians(degrees) {
	 return degrees * (Math.PI / 180);
}

function keepInWindow(object) {
	if (object.x <= 0) {
		object.x = w;
	}
	else if (object.x >= w) {
		object.x = 0;
	}
	if (object.y <= 0) {
		object.y = h;
	}
	else if (object.y >= h) {
		object.y = 0;
	}
}

function checkCollision(object1, object2) {
	//checks collision with one object and another
	if ((object1.x < object2.x + object2.width) && (object1.x + object1.width > object2.x) && 
		(object1.y < object2.y + object2.height) && (object1.y + object1.height > object2.y)) {
		//we're touching
		return true;
	}	
	else {
		return false;
	}
}

function initializeLevel(lvl) {
	if (lvl == 1) {
		p1Ship = makeShip(5, (w/2), (h/2), 80, 80, 90, 0);
	}
	document.getElementById("levelText").textContent="Level " + lvl;
	document.getElementById("sLives").textContent = p1Ship.getLives();
	document.getElementById("sKillCount").textContent = killCount;
	asteroids = [];
	explosions = []; //clear these too
	//wow this is messy code and handling I'm sorry
	for (var i = 0; i < (lvl); i++) {
		var tempX = (Math.random() * w);
		while (tempX < p1Ship.x + p1Ship.width && tempX > p1Ship.x - p1Ship.width) {
			tempX = (Math.random() * w); //keep going until we're not on top of the player
		}
		var tempY = (Math.random() * h);
		while (tempY < p1Ship.y + p1Ship.height && tempY > p1Ship.y - p1Ship.height) {
			tempY = (Math.random() * h); //keep going until we're not on top of the player
		}
		asteroids.push(makeAsteroid(tempX, tempY, 100 + (Math.random() * 100), 100 + (Math.random() * 100), 1 + (Math.random() * 5), Math.random() * 360));
		console.log("asteroids width, height, maxsize " + asteroids[asteroids.length - 1].width + " " + asteroids[asteroids.length - 1].height + " " + asteroids[asteroids.length - 1].getMaxSize());
	}
}

function nextLevel() {
	play = 4;
}

function endLevel() {
	play = 3;
}	

window.onload = function() {

	var shipImg = document.getElementById("playerShip");

	//load canvas
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d"),
    	w = canvas.width = 1150,
    	h = canvas.height = 600;

    function waitNextLevel() {
    	ctx.drawImage(waitLevelImg, 0, h / 2, w, h / 6);
    }

   	function pause() {
   		ctx.drawImage(pauseImg, 0, h / 2, w, h / 6);
   	}

   	function startScreen() {
   		ctx.drawImage(startScreenImg, 0, h / 2, w, h / 6);
   	}

   	function gameOver() {
   		ctx.drawImage(gameOverImg, 0, h / 2, w, h / 6);
   		//show the span of the kill
   	}

    function rotateShip() {
        ctx.save();
        ctx.translate(p1Ship.x, p1Ship.y);
        ctx.rotate(toRadians(p1Ship.angle));
        ctx.drawImage(shipImg, -40, -40, p1Ship.width, p1Ship.height);
        ctx.restore();
    }

	function moveShip() {

		if (87 in keysDown || 38 in keysDown) {// P2 holding down the w key or up arrow
            if (p1Ship.speed < 7) {
            	//cap the speed at a certain amount
            	p1Ship.speed += .1;
            }
        }
        if (83 in keysDown || 40 in keysDown) { // P2 holding down (key: s or down)
            if (p1Ship.speed > 0) {
            	//we can't go at an anti speed
            	p1Ship.speed -= .1;
            }
        }

        if (65 in keysDown || 37 in keysDown) { // P2 holding down (key: a or left)
        	p1Ship.angle -= 4; //rotate to the left, 0 to 180 to 360
        }
        if (68 in keysDown || 39 in keysDown) { // P2 holding down (key: d or right)
            p1Ship.angle += 4; //rotate to the right, 360 to 180 to 0
        }

        //ANGLE HANDLING
        if (p1Ship.angle > 360) { //angles can't go above 360 here
        	p1Ship.angle = 360 - p1Ship.angle; //i.e. 361 becomes 1 degree
        }
        else if (p1Ship.angle < 0) { //angles can't go below 360 here, place negative angles within bounds
        	p1Ship.angle = 360 + p1Ship.angle; //i.e. -20 degrees becomes 340 degrees
        }

        p1Ship.x -= (p1Ship.speed * Math.cos(toRadians(p1Ship.angle))); //our x should move based on angle and speed
        p1Ship.y -= (p1Ship.speed * Math.sin(toRadians(p1Ship.angle))); //our y should move based on angle and speed

        keepInWindow(p1Ship);

        if (p1Ship.getVisible()) {
        	rotateShip();
        }
	}

	function moveAsteroids() {
		for (var i = 0; i < asteroids.length; i++) {
			if (asteroids[i].getVisible()) {
				asteroids[i].y += (asteroids[i].speed * Math.sin(toRadians(asteroids[i].angle))) //a certain percentage of the angle
				asteroids[i].x += (asteroids[i].speed * Math.cos(toRadians(asteroids[i].angle))) //a certain percentage of the angle
				keepInWindow(asteroids[i]); //if we're going out of bounds, resolve	
				ctx.drawImage(asteroidImg, asteroids[i].x, asteroids[i].y, asteroids[i].width, asteroids[i].height);

				if (checkCollision(asteroids[i], p1Ship)) {
					p1Ship.damage(); //also create an explosion here
					explosions.push(makeExplosion(asteroids[i].x, asteroids[i].y, asteroids[i].width, asteroids[i].height));
					breakAsteroid(asteroids[i]);
				}
			}
		}
	}

	function showExplosions() {
		for (var i = 0; i < explosions.length; i++) {
			if (explosions[i].getVisible()) {
				//draw us
				ctx.drawImage(explosionImg, explosions[i].x, explosions[i].y, explosions[i].width, explosions[i].height);
				explosions[i].incrementTimer();
			}
		}
	}

	//make creates the object, spawn adds to the screen/moves to screen, move moves it across the screen, draw puts on the screen

	function spawnLaser(angle, x, y) {
		//if there's no invisible lasers, make a new one
		//if there is an invisible laser, just bring it back here and make it visible
		var tempLaser = -1;
		for (var i = 0; i < lasers.length; i++) {
			if (!lasers[i].getVisible()) {
				//we're free!
				tempLaser = i;
			}
		}
		if (tempLaser != -1) {
			//we found one, use this instead
			lasers[tempLaser].x = x;
			lasers[tempLaser].y = y;
			lasers[tempLaser].angle = angle;
			lasers[tempLaser].setVisible(true, w, h);
		}
		else {
			//we don't have any lasers, make a new one
			lasers.push(makeLaser(x, y, angle)); //add a new one to the array
		}
	}

	function handleLaser(laser) {
		//if the lasers go outside the window, set them to invisible
		if (laser.x <= 0 || laser.x >= w || laser.y <= 0 || laser.y >= h) {
			laser.setVisible(false, w, h); //this should handle no more collision/movement
		}
	}

	function moveLasers() {
		for (var i = 0; i < lasers.length; i++) {
			if (lasers[i].getVisible()) {
				lasers[i].y -= (lasers[i].speed * Math.sin(toRadians(lasers[i].angle))); //a certain percentage of the angle
				lasers[i].x -= (lasers[i].speed * Math.cos(toRadians(lasers[i].angle))); //a certain percentage of the angle
				handleLaser(lasers[i]);
				ctx.drawImage(laserImg, lasers[i].x, lasers[i].y, lasers[i].width, lasers[i].height);
				//collision with lasers is handled in the asteroids, because there will probably be more asteroids than lasers
				//onscreen ideally
				for (var j = 0; j < asteroids.length; j++) {
					if (checkCollision(lasers[i], asteroids[j])) {
						//we're touching a laser
						explosions.push(makeExplosion(asteroids[j].x, asteroids[j].y, asteroids[j].width, asteroids[j].height));
						lasers[i].setVisible(false);
						breakAsteroid(asteroids[j]);
						break;
					}
				}				
			}
		}
	}

    function updateScreen() {
    	//have we won?
		asteroidsDead();
    	moveShip();
		//drawing is handled within moveShip cuz it needs to pass stuff, this is a little messy
		moveAsteroids();
		moveLasers();
		showExplosions();
	}

    addEventListener("keydown", function (e) {
    	keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
    	if (e.keyCode == 80) {
    		//we've pressed P
    		if (play == 1) {
    			play = 2;
    		}
    		else if (play == 2) {
    			play = 1;
    			main();
    		}
    	}
    	else if (e.keyCode == 78) {
    		//we've pressed N
    		if (play == 4) {
    			//next level
    			play = 1;
    			p1Ship.x = (w / 2);
    			p1Ship.y = (h / 2);
    			level++;
    			initializeLevel(level);
    			main();
    		}    		
    	}
    	else if (e.keyCode == 82) {
    		//we've pressed R
    		if (play == 3) {
    			//game over, restart, start screen
    			play = 0;
    			level = 1;
    			killCount = 0;
    			initializeLevel(level);
    			ctx.clearRect(0,0,w,h);
    			main();
    		}   
    	}
    	else if (e.keyCode == 32) {
    		//space bar
    		if (play == 1) {
    			//playing, shoot
    			var xOffset = p1Ship.x;
    			var yOffset = p1Ship.y;
    			if (p1Ship.angle == 0 || p1Ship.angle == 180) {
    				//our sin is going to be 0, we're facing to the right or left , yOffset should be -height
    				//xOffset is going to be to the right for left, or to the left for right
    				yOffset -= (p1Ship.height);
    				xOffset -= (Math.cos(toRadians(p1Ship.angle)) * (p1Ship.width / 2));
    			}
    			else if (p1Ship.angle == 90 || p1Ship.angle == 270) {
    				//our cos is going to be 0, we're facing up or down, our x should be -width
    				//yOffset is going to be to the down for up or to the up for down
    				xOffset -= (p1Ship.width / 2.5);
    				yOffset -= (Math.sin(toRadians(p1Ship.angle)) * (p1Ship.height / 2));
    			}
    			else {
    				//some other angle, cos and sin should be working fine
    				//i.e. at degree 45, should do half of each to the left and down
    				xOffset -= (Math.sin(toRadians(p1Ship.angle)) * (p1Ship.width / 10));
    				yOffset += (Math.cos(toRadians(p1Ship.angle)) * (p1Ship.height / 8));
    			}
    			spawnLaser(p1Ship.angle, xOffset, yOffset);
    		}
    		else if (play == 0) {
    			//start screen, start
    			play = 1;
    			main();
    		}
    	}
        delete keysDown[e.keyCode];
    }, false); 
           
    function main(){
    	//continue playing
    	if (play == 1) { //playing
    	    ctx.clearRect(0,0,w,h);
        	updateScreen();
        	requestAnimationFrame(main);   	
    	}
    	else if (play == 0) {
    		startScreen();
    	}
    	else if (play == 3) { //we've lost
    		gameOver();
    	}
    	else if (play == 2) { //paused
    		pause();
    	}
    	else if (play == 4) {
    		waitNextLevel();
    	}
 		
    }

    initializeLevel(level);
    main();
   
}               