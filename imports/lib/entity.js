import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
export function Entity(state, pixiApp) {
  let that = this;

  // add the pixi sprite to the pixiApp
  this.spriteSheet = {
    path: "stand_sprites.png",
    x: 0,
    y: 0,
    width: 192,
    height: 192,
  };
  this.defaults = {
    startingPosition: {x: 0, y: 0}
  };

  this.loadedFn = function(loader, resources) {
    let texture = pixiApp.loader.resources[this.spriteSheet.path].texture;
    let rectangle = new PIXI.Rectangle(
      this.spriteSheet.x,
      this.spriteSheet.y,
      this.spriteSheet.width,
      this.spriteSheet.height
    );
    texture.frame = rectangle;
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.position.set(this.defaults.startingPosition.x, this.defaults.startingPosition.y);
    pixiApp.stage.addChild(this.sprite);
  }

  // create the Matter.Body relevant for the entityState passed in
  this.body = Matter.Bodies.rectangle(state.x, state.y, state.width, state.height);

};
