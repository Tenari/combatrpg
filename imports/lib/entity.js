import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import { MOVES } from '/imports/config/moves.js';
import { Move } from '/imports/lib/move.js';

export function Entity(options, pixiApp) {
  let that = this;

  this.sprites = {};
  this.state = {
    walking: false,
    dashing: false,
    move: null,
    moveFrame: null, // the last perfom()ed move frame (relative to the move itself, not the global gameTick)
  }

  // array in reverse priority order
  this.knownMoves = [
    new Move(MOVES.light_attack),
    new Move(MOVES.dash_left),
    new Move(MOVES.dash_right),
    new Move(MOVES.jump),
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
    if (options.type == 'ground') {
      this.sprite = new PIXI.Sprite(this.sheet.textures['ground.png']);
      this.sprite.width = options.width;
      this.sprite.height = options.height;
      this.sprite.position.set(options.x, options.y);
      pixiApp.stage.addChild(this.sprite);
    } else {
      let widthFactor = options.width / this.sheet.textures['barb_clothes_0001.png'].orig.width;
      let heightFactor = options.height / this.sheet.textures['barb_clothes_0001.png'].orig.height;
      this.sprites.body = new PIXI.Sprite(this.sheet.textures['barb_body_0001.png']);
      this.sprites.body.width = options.width;
      this.sprites.body.height = options.height;
      this.sprites.clothes = new PIXI.Sprite(this.sheet.textures['barb_clothes_0001.png']);
      this.sprites.clothes.width = options.width;
      this.sprites.clothes.height = options.height;
      this.sprites.weapon = new PIXI.Sprite(this.sheet.textures['barb_weapon_0001.png']);
      this.sprites.weapon.width = this.sheet.textures['barb_weapon_0001.png'].orig.width * widthFactor;
      this.sprites.weapon.height = this.sheet.textures['barb_weapon_0001.png'].orig.height * heightFactor;
      this.sprites.weapon.anchor.set(0.375, 0.5);

      this.container = new PIXI.Container();
      this.container.position.set(options.x, options.y);
      let that = this;
      _.each(this.sprites, function(sprite, key) {
        that.container.addChild(sprite)
      })
      pixiApp.stage.addChild(this.container);
    }
  }

  this.setSprite = function(spriteName){
    if (this.sprite) {
      this.sprite.texture = this.sheet.textures[spriteName];
    }
  }

  this.setSprites = function(name, number){
    let faceRight = true;
    // TODO actually use correct logic for facing the characters towards each other
    if (options.id == "3q2vrjgggLmJDR5uJ") {
      faceRight = false;
    }
    let that = this;
    _.each(['body','clothes','weapon'], function(part){
      that.sprites[part].texture = that.sheet.textures[name+"_"+part+"_"+number+".png"];
      if (!faceRight && that.sprites[part].scale.x > 0) {
        that.sprites[part].scale.x = -1 * that.sprites[part].scale.x;
      }
    })
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
      //this.setSprite(this.idleSprites[ Math.floor(tick/this.idleFrameRate) % this.idleSprites.length]);
    }
  }
};
