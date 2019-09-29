import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import { Entity } from '/imports/lib/entity.js';

export function FightEngine(fight, $container){
  var that = this;
  this.tick = 0;
  this.entities = [];
  this.pastStates = {};
  var OLD_FRAMES = 5;

  // PIXIjs rendering engine setup
  this.pixiApp = new PIXI.Application({
    // see options in PIXI.Application docs: http://pixijs.download/release/docs/PIXI.Application.html
    antialias: true,
  });
  $container.append(this.pixiApp.view);

  // initialize each entity in the fight object
  var paths = [];
  _.each(fight.entities, function(entityState) {
    let entity = new Entity(entityState, that.pixiApp);
    that.entities.push(entity);
    paths.push(entity.spriteSheet.path);
  })

  this.pixiApp.loader.add(_.uniq(paths)).load(function(loader, resources){
    _.each(that.entities, function(entity){
      entity.loadedFn(loader, resources);
    })
  })

  // Matter-js physics engine setup
  this.physicsEngine = Matter.Engine.create();
  this.world = this.physicsEngine.world;
  var bodies = _.map(this.entities, function(entity){
    return entity.body;
  })
  Matter.World.add(this.world, bodies);

  this.renderFrame = function(frameNumber) {
    if (frameNumber > this.tick) {
      delete this.pastStates[this.tick - OLD_FRAMES];
      this.pastStates[this.tick] = this.currentState(); //save the current state

      // simulate forward
      Matter.Engine.update(this.physicsEngine, 20)
    } else if (frameNumber < this.tick) {
      //rollback to frameNumber
      var that = this;
      _.each(this.pastStates[frameNumber].entities, function(e){
        e = JSON.parse(e);
        Matter.Body.setVelocity(that.entities[e.index].body, e.velocity);
        Matter.Body.setPosition(that.entities[e.index].body, e.position);
      })
    } // else frameNumber == tick, do nothing
    this.matchAndRender();
    this.tick = frameNumber;
  }

  this.currentState = function(){
    return {
      tick: this.tick,
      entities: _.map(this.entities, function(entity, index){
        return JSON.stringify({index, position: entity.body.position, velocity: entity.body.velocity});
      }),
      inputs: []
    };
  }

  // Stores the state of all rollbackable objects and systems in the game.
  this.storeState = function() {
    this.storedState = this.currentState();
    /*
    // All rollbackable objects and systems will have a CopyState() method.
    this.storedState.world = World:CopyState()
    this.storedState.inputSystem = InputSystem:CopyState()
    this.storedState.matchSystem = MatchSystem:CopyState()
    this.storedState.players = {self.players[1]:CopyState(), self.players[2]:CopyState()}

    this.storedState.tick = this.tick
    */
  }


  // match the pixiApp to the MatterJs representation and render the PIXIstage
  this.matchAndRender = function() {
    _.each(this.entities, function(entity) {
      if (entity.sprite && entity.body.position)
        entity.sprite.position.set(entity.body.position.x, entity.body.position.y);
    })
    this.pixiApp.renderer.render(this.pixiApp.stage);
  }
};
