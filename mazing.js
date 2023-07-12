var Position = function(x, y) {
  this.x = x;
  this.y = y;
}

Position.prototype.toString = function() {
  return this.x + ":" + this.y;
};

var Mazing = function(id) {

  // Original JavaScript code by Chirp Internet: www.chirpinternet.eu
  // Please acknowledge use of this code by including this header.

  /* bind to HTML element */

  this.mazeContainer = document.getElementById(id);

  this.mazeScore = document.createElement("div");
  this.mazeScore.id = "maze_score";

  this.mazeMessage = document.createElement("div");
  this.mazeMessage.id = "maze_message";

  this.heroScore = this.mazeContainer.getAttribute("data-steps") - 2;

  this.maze = [];
  this.heroPos = {};
  this.heroHasKey = false;
  this.childMode = false;

  this.utter = null;

  this.swipedir = "";
  this.startX = 0;
  this.startY = 0;
  this.distX = 0;
  this.distY = 0;
  this.threshold = 20;
  this.restraint = 10;
  this.allowedTime = 1000;
  this.elapsedTime = 0;
  this.startTime = 0;

  for(i=0; i < this.mazeContainer.children.length; i++) {
    for(j=0; j < this.mazeContainer.children[i].children.length; j++) {
      var el =  this.mazeContainer.children[i].children[j];
      this.maze[new Position(i, j)] = el;
      if(el.classList.contains("entrance")) {
        /* place hero on entrance square */
        this.heroPos = new Position(i, j);
        this.maze[this.heroPos].classList.add("hero");
      }
    }
  }

  var mazeOutputDiv = document.createElement("div");
  mazeOutputDiv.id = "maze_output";

  mazeOutputDiv.appendChild(this.mazeScore);
  mazeOutputDiv.appendChild(this.mazeMessage);

  mazeOutputDiv.style.width = this.mazeContainer.scrollWidth + "px";
  this.setMessage("first find the key");

  this.mazeContainer.insertAdjacentElement("afterend", mazeOutputDiv);

  /* activate control keys */

  this.keyPressHandler = this.mazeKeyPressHandler.bind(this);
  this.touchStartHandler = this.mazeTouchStartHandler.bind(this);
  this.touchEndHandler = this.mazeTouchEndHandler.bind(this);
  document.addEventListener("keydown", this.keyPressHandler, false);
  this.mazeContainer.addEventListener("touchstart", this.touchStartHandler, false);
  this.mazeContainer.addEventListener("touchend", this.touchEndHandler, false);
  this.mazeContainer.addEventListener("touchmove", function(e) {e.preventDefault();}, false);
};

Mazing.prototype.enableSpeech = function() {
  this.utter = new SpeechSynthesisUtterance()
  this.setMessage(this.mazeMessage.innerText);
};

Mazing.prototype.setMessage = function(text) {

  /* display message on screen */
  this.mazeMessage.innerHTML = text;
  this.mazeScore.innerHTML = this.heroScore;

  if(this.utter && text.match(/^\w/)) {
    /* speak message aloud */
    this.utter.text = text;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(this.utter);
  }

};

Mazing.prototype.heroTakeTreasure = function() {
  this.maze[this.heroPos].classList.remove("nubbin");
  this.heroScore += 10;
  this.setMessage("yay, treasure!");
};

Mazing.prototype.heroTakeKey = function() {
  this.maze[this.heroPos].classList.remove("key");
  this.heroHasKey = true;
  this.heroScore += 20;
  this.mazeScore.classList.add("has-key");
  this.setMessage("you now have the key!");
};

Mazing.prototype.gameOver = function(text, success = false) {
  /* de-activate control keys */
  document.removeEventListener("keydown", this.keyPressHandler, false);
  this.setMessage(text);
  if (success) {
    this.mazeContainer.classList.add("finished");
  } else {
    this.mazeContainer.classList.add("tryagain");
  }
};

Mazing.prototype.heroWins = function() {
  this.mazeScore.classList.remove("has-key");
  this.maze[this.heroPos].classList.remove("door");
  this.heroScore += 50;
  this.gameOver("You got it!", true);
};

Mazing.prototype.tryMoveHero = function(pos) {

  if("object" !== typeof this.maze[pos]) {
    return;
  }

  var nextStep = this.maze[pos].className;

  /* before moving */

  if(nextStep.match(/sentinel/)) {
    /* ran into a moster - lose points */
    this.heroScore = Math.max(this.heroScore - 5, 0);

    if(!this.childMode && (this.heroScore <= 0)) {
      /* game over */
      this.gameOver("sorry, try again!.");
    } else {
      this.setMessage("ow, that hurt!");
    }

    return;
  }

  if(nextStep.match(/wall/)) {
    return;
  }

  if(nextStep.match(/exit/)) {
    if(this.heroHasKey) {
      this.heroWins();
    } else {
      this.setMessage("Not so fast, you need a key to unlock the door :P");
      return;
    }
  }

  /* move hero one step */

  this.maze[this.heroPos].classList.remove("hero");
  this.maze[pos].classList.add("hero");
  this.heroPos = pos;

  /* check what was stepped on */

  if(nextStep.match(/nubbin/)) {
    this.heroTakeTreasure();
    return;
  }

  if(nextStep.match(/key/)) {
    this.heroTakeKey();
    return;
  }

  if(nextStep.match(/exit/)) {
    return;
  }

  if((this.heroScore >= 1) && !this.childMode) {

    this.heroScore--;

    if(this.heroScore <= 0) {
      /* game over */
      this.gameOver("sorry, you didn't make it");
      return;
    }

  }

  this.setMessage("...");

};

Mazing.prototype.mazeKeyPressHandler = function(e) {

  var tryPos = new Position(this.heroPos.x, this.heroPos.y);

  switch(e.key)
  {
    case "ArrowLeft":
      this.mazeContainer.classList.remove("face-right");
      tryPos.y--;
      break;

    case "ArrowUp":
      tryPos.x--;
      break;

    case "ArrowRight":
      this.mazeContainer.classList.add("face-right");
      tryPos.y++;
      break;

    case "ArrowDown":
      tryPos.x++;
      break;

    default:
      return;

  }

  this.tryMoveHero(tryPos);

  e.preventDefault();
};

Mazing.prototype.handleSwipe = function(direction) {
  var tryPos = new Position(this.heroPos.x, this.heroPos.y);

  switch(direction)
  {
    case "left":
      this.mazeContainer.classList.remove("face-right");
      tryPos.y--;
      break;

    case "up":
      tryPos.x--;
      break;

    case "right":
      this.mazeContainer.classList.add("face-right");
      tryPos.y++;
      break;

    case "down":
      tryPos.x++;
      break;

    default:
      return;
  }
  this.tryMoveHero(tryPos);
}

Mazing.prototype.mazeTouchStartHandler = function(e) {
  var touchobj = e.changedTouches[0]
  this.swipedir = 'none'
  this.dist = 0
  this.startX = touchobj.pageX
  this.startY = touchobj.pageY
  this.startTime = new Date().getTime() // record time when finger first makes contact with surface
  e.preventDefault()
}; 

Mazing.prototype.mazeTouchEndHandler = function(e) {
  var touchobj = e.changedTouches[0]
  this.distX = touchobj.pageX - this.startX // get horizontal dist traveled by finger while in contact with surface
  this.distY = touchobj.pageY - this.startY // get vertical dist traveled by finger while in contact with surface
  this.elapsedTime = new Date().getTime() - this.startTime // get time elapsed
  if (this.elapsedTime <= this.allowedTime){ // first condition for awipe met
      // if (Math.abs(this.distX) >= this.threshold && Math.abs(this.distY) <= this.restraint){ // 2nd condition for horizontal swipe met
      //     this.swipedir = (this.distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
      // }
      // else if (Math.abs(this.distY) >= this.threshold && Math.abs(this.distX) <= this.restraint){ // 2nd condition for vertical swipe met
      //     this.swipedir = (this.distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
      // }
      if (Math.abs(this.distX) >= Math.abs(this.distY)) { // 2nd condition for horizontal swipe met
          this.swipedir = (this.distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
      }
      else { 
          this.swipedir = (this.distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
      }
  }
  this.handleSwipe(this.swipedir)
  e.preventDefault()
}; 

Mazing.prototype.setChildMode = function() {
  this.childMode = true;
  this.heroScore = 0;
  this.setMessage("collect all the treasure");
};