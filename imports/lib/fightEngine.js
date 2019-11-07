import * as Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import { Entity } from '/imports/lib/entity.js';

export function FightEngine(fight, character, $container){
  var that = this;
  this.tick = 0;
  this.entities = [];
  this.characters = {};
  this.storedState = {};
  this.localInputBuffer = [];
  this.remoteInputBuffer = [];

  var OLD_FRAMES = 5;
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

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
    paths.push(entity.spritesheet);
    if (entityState.type == 'character') {
      that.characters[entityState.id] = entity;
    }
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

  // accept new inputs and simulate forward 1 tick
  // inputs = {id: inputObject, id: inputObject} for each character
  this.advanceGameState = function(inputs) {
    _.each(fight.characters, function(cid) {
      let entity = that.characters[cid];
      if(cid == "3q2vrjgggLmJDR5uJ") {
        console.log(entity.state.partiallyMatchedMoves[0],entity.state.partiallyMatchedMoves[1], that.tick);
      }
      entity.act(inputs[cid]);
    })
    Matter.Engine.update(this.physicsEngine, 20); // 20ms per frame
    this.tick += 1;
  }

  // renders the current game state to the screen
  this.render = function(){
    _.each(this.entities, function(entity) {
      if (entity.sprite && entity.body.position) {
        entity.sprite.position.set(entity.body.position.x, entity.body.position.y);
      }
      if (entity.container && entity.body.position) {
        entity.container.position.set(entity.body.position.x, entity.body.position.y);
      }
    })
    this.pixiApp.renderer.render(this.pixiApp.stage);
  }

  // returns a snapshot of the game's current state
  this.saveState = function(){
    return {
      tick: this.tick,
      entities: _.map(this.entities, function(entity, index){
        return JSON.stringify({index, position: entity.body.position, velocity: entity.body.velocity});
      }),
    };
  }

  // overwites the game's current simulation state with information passed in the `state` variable.
  //   `state` is the same object as returned from this.saveState()
  this.loadState = function(state) {
    console.log('restoring state', state);
    var that = this;
    _.each(state.entities, function(e){
      e = JSON.parse(e);
      Matter.Body.setVelocity(that.entities[e.index].body, e.velocity);
      Matter.Body.setPosition(that.entities[e.index].body, e.position);
    })
    this.tick = state.tick;
  }

  // step forward 1 tick
  this.update = function(network, tick, options){
    if (!options) options = {render: true};
    _.each(fight.characters, function(cid) {
      let entity = that.characters[cid];
      let code = 'Remote';
      if (cid == character._id) { // local
        code = 'Local';
      }
      let inputHistory = [];
      for (let i=0;i<22; i+=1) {
        inputHistory[i] = network['get'+code+'InputState'](tick-i) || {};
      }
      entity.act(inputHistory, tick + 1);
    })
    Matter.Engine.update(this.physicsEngine, 20)
    if (options.render) {
      this.matchAndRender();
    }
    this.tick = tick + 1;
  }

  this.currentState = function(){
    return {
      tick: this.tick,
      entities: _.map(this.entities, function(entity, index){
        return JSON.stringify({index, position: entity.body.position, velocity: entity.body.velocity});
      }),
    };
  }

  // Stores the state of all rollbackable objects and systems in the game.
  this.storeState = function() {
    this.storedState = this.currentState();
  }

  this.getSyncData = function() {
    return this.currentState().entities;
  }

  // match the pixiApp to the MatterJs representation and render the PIXIstage
  this.matchAndRender = function() {
    _.each(this.entities, function(entity) {
      if (entity.sprite && entity.body.position) {
        entity.sprite.position.set(entity.body.position.x, entity.body.position.y);
      }
      if (entity.container && entity.body.position) {
        entity.container.position.set(entity.body.position.x, entity.body.position.y);
      }
    })
    this.pixiApp.renderer.render(this.pixiApp.stage);
  }


  // rollback to the game state in `this.storedState`
  this.restoreState = function(network){
    console.log('restoring state', this.storedState);
    var that = this;
    _.each(this.storedState.entities, function(e){
      e = JSON.parse(e);
      Matter.Body.setVelocity(that.entities[e.index].body, e.velocity);
      Matter.Body.setPosition(that.entities[e.index].body, e.position);
    })
    this.tick = this.storedState.tick;
  }

  // Rollback if needed.
  this.handleRollbacks = function(tick, network){
    console.log('checking to rollback', network.lastSyncedTick, tick, network.confirmedTick)
    // The input needed to resync state is available so rollback.
    // Network.lastSyncedTick keeps track of the lastest synced game tick.
    // When the tick count for the inputs we have is more than the number of synced ticks it's possible to rerun those game updates with a rollback.
    if (tick >= 0 && tick > (network.lastSyncedTick + 1) && network.confirmedTick > network.lastSyncedTick && network.lastSyncedTick > 0) {

      // Must revert back to the last known synced game frame.
      this.restoreState();

      // The number of frames that's elasped since the game has been out of sync.
      // Rerun rollbackFrames number of updates.
      let rollbackFrames = tick - network.lastSyncedTick;
      console.log('rollingback ' + rollbackFrames + ' frames');

      for (let i=0; i < rollbackFrames; i += 1) {
        let lastRolledBackGameTick = this.tick;
        this.update(network, lastRolledBackGameTick, {render: false});

        // Confirm that we are indeed still synced
        if (lastRolledBackGameTick <= network.confirmedTick) {
          // Store the state since we know it's synced. We really only need to call this on the last synced frame.
          // Leaving in for demonstration purposes.
          this.storeState();
          network.lastSyncedTick = lastRolledBackGameTick;

          // Confirm the game clients are in sync
          this.syncCheck();
        }
      }
    }
  }

  this.syncCheck = function(){
    // TODO
  }
};
