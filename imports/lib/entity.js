import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import { MOVES } from '/imports/config/moves.js';
import { Move } from '/imports/lib/move.js';

export function Entity(options, pixiApp) {
  let that = this;

  this.state = {
    walking: false,
    dashing: false,
    move: null,
    moveFrame: null, // the last perfom()ed move frame (relative to the move itself, not the global gameTick)
  }
  var INPUTS = {
    'jump': 87,
    'down': 83,
    'left': 65,
    'right': 68,
  };
  var SPEED = 3;

  // array in reverse priority order
  this.knownMoves = [
    new Move(MOVES.dash_left),
    new Move(MOVES.dash_right),
    new Move(MOVES.left),
    new Move(MOVES.right)
  ];

  // add the pixi sprite to the pixiApp
  this.idleSprites = ["stand.0001.png", "stand.0002.png", "stand.0003.png"];
  this.idleFrameRate = 9; // how many frames to wait before moving to next frame. bigger number = slower visual animation
  this.defaults = {
    spritesheet: 'spritesheet.json',
  };
  this.spritesheet = this.defaults.spritesheet;

  this.loadedFn = function(loader, resources) {
    this.sheet = pixiApp.loader.resources[this.spritesheet].spritesheet;
    this.sprite = new PIXI.Sprite(this.sheet.textures[options.type == 'ground' ? 'ground.png' : this.idleSprites[0]]);
    this.sprite.width = options.width;
    this.sprite.height = options.height;
    this.sprite.position.set(options.x, options.y);
    pixiApp.stage.addChild(this.sprite);
  }

  this.setSprite = function(spriteName){
    this.sprite.texture = this.sheet.textures[spriteName];
  }

  // create the Matter.Body relevant for the entityState passed in
  this.body = Matter.Bodies.rectangle(options.x, options.y, options.width, options.height, options.matterOptions);

  // based on the inputHistory, and our current state, do the action the user intends.
  //   handles detecting if we are hitstunned or not, if we are dashing or nomal moving, etc
  //   expects inputHistory[0] to be current frame, [1] to be previous frame, etc
  this.act = function(inputHistory, tick) {
    /*
      pseudo:
        if (we are NOT in a move OR we are in a cancelable move)
          // detect possible new move and update state
          for each move in myKnownMoves // in priority order, meaning first match takes priority
            if move.matchesInput(inputHistory, this.state)
              this.state.move = move;
              break;

        if this.state.move // if we are in a move, (possibly newly)
          perform the next frame of the move
    */
    if (!this.state.move || this.state.move.cancelable) {
      for(let i = 0; i < this.knownMoves.length; i += 1) {
        let move = this.knownMoves[i];
        if (move.matchesInput(inputHistory, this.state)){
          this.state.move = move;
          this.state.moveFrame = -1;
          break;
        }
      }
    }


    if (this.state.move) {
      this.state.move.perform(this);
    } else { // idle
      this.setSprite(this.idleSprites[ Math.floor(tick/this.idleFrameRate) % this.idleSprites.length]);
    }

    // movement
    // detect dashing, defined as double tap same movement direction without any other movement keys pressed
      // maximum time between taps is 20 frames
    /*
    if (this.state.dashing) {
      if (tick - this.state.dashStart >= 25) { // dash for 25 frames
        this.state.dashing = false;
        Matter.Body.setVelocity(this.body, Matter.Vector.create(0, this.body.velocity.y));
      }
    // to initiate a dash, must currently be pressing left or right (but not both)
    } else if ((inputHistory[0][INPUTS.left] && !inputHistory[0][INPUTS.right]) || (inputHistory[0][INPUTS.right] && !inputHistory[0][INPUTS.left])) {
      let moveDirection = inputHistory[0][INPUTS.left] ? 'left' : 'right';
      let otherDirection = moveDirection == 'left' ? 'right' : 'left';
      // AND, previous frame must NOT be pressing either left or right
      if (!inputHistory[1][INPUTS.left] && !inputHistory[1][INPUTS.right]) {
        // loop back through previous 20 frames of input to find matching directional input
        let hitWrongDirection = false;
        let foundPreviousTap = false;
        let i = 2;
        while (!foundPreviousTap && !hitWrongDirection && i < 20) {
          if (inputHistory[i][INPUTS[moveDirection]]) foundPreviousTap = true;
          if (inputHistory[i][INPUTS[otherDirection]]) hitWrongDirection = true;
          i += 1;
        }
        if (!hitWrongDirection && foundPreviousTap) {
          // DASHING!
          console.log('dashing');
          this.dash(moveDirection, tick);
        } else {
          console.log('here');
          this.normalMove(moveDirection);
        }
      } else { // if the previous input state DID have a directional input, then we know we aren't dashing, so just normal move
        this.normalMove(moveDirection);
      }
    } */
  }

  this.normalMove = function(direction) {
    let x = SPEED;
    if (direction === 'left') {
      x = -1*SPEED;
    }
    this.state.walking = true;
    Matter.Body.setVelocity(this.body, Matter.Vector.create(x, this.body.velocity.y));
  }

  this.dash = function(direction, tick) {
    let x = 3*SPEED;
    if (direction === 'left') {
      x = -3*SPEED;
    }
    this.state.dashStart = tick;
    this.state.dashing = true;
    this.state.walking = false;
    Matter.Body.setVelocity(this.body, Matter.Vector.create(x, this.body.velocity.y));
  }
};
