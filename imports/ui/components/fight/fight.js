import { Meteor } from 'meteor/meteor';
import Peer from 'peerjs';
import { FightEngine } from '/imports/lib/fightEngine.js';
import { Network } from '/imports/lib/network.js';
import { Fights } from '/imports/api/fights/fights.js';
import { Characters } from '/imports/api/characters/characters.js';
import { animations } from '/imports/config/animation.js';
import './fight.html';

Template.fight.onDestroyed(function () {
  $(window).off('keypress', handleKey(this))
});
Template.fight.onCreated(function () {
  this.subscribe('fights.all');
  $(window).on('keypress', handleKey(this));
  this.opponentInputHistory = {};
  this.inputHistory = {};
  this.simulationFrame = 1;
  this.network = new Network();

  this.autorun(() => {
    var instance = this;
    const character = Characters.findOne({userId: Meteor.userId()});
    if (!character) return false;

    if (!instance.peer) {
      // setup peerJS connection
      instance.peer = new Peer(character._id, {host: 'localhost', port: 9000, path: '/myapp'});
      console.log('my peer id', character._id);
      instance.peer.on('connection', function(conn){
        instance.network.connection = conn;
        conn.on('data', instance.network.receiveData);
      })
    }
    instance.fight = Fights.findOne({characters: character._id});
    const fight = instance.fight;
    if (fight) {
      //first handle networking or ai initialization
      // fight is either with monster or player
      if (fight.characters.length > 1) { // two characters => peerJS connection
        if (!instance.network.connection) {
          instance.network.connection = instance.peer.connect(_.find(fight.characters, function(cid){return cid != character._id}));
          instance.network.connection.on('data', instance.network.receiveData);
          if (fight.characters[0] == character._id) { //first character isServer
            instance.network.startServer();
          } else {
            instance.network.startConnection();
          }
        }
      } else { // TODO ai monster opponent initialization
      }

      // then handle fight ui initialization
      setupFight(instance);
    }
  })
});

function setupFight(instance){
  // instance.fight contains the details about what entities are in the fight and the level + background etc, which are used to initialize the game engine
  instance.fightEngine = new FightEngine(instance.fight, $('#fight'));
  window.setInterval(function(){
    if (!instance.network.connection) return false;

    if (!instance.opponentInputHistory[instance.simulationFrame - 4]) { // if we DONT have the inputs for 5 frames ago...
      // we have to wait
      console.log('waiting', instance.simulationFrame);
    } else {
      instance.fightEngine.renderFrame(instance.simulationFrame, instance.inputHistory, instance.opponentInputHistory);
      instance.simulationFrame += 1;
      console.log(instance.simulationFrame);
    }
  }, 2000)

  // start the 20ms update loop
  // for each 20ms frame
    // Matter.Engine.update(engine, [delta=20], [correction=1]) // can ignore correction for now
}

Template.fight.onRendered(function () {
});

Template.fight.helpers({
});

Template.fight.events({
  'submit .fight-link-add'(event, instance) {
    event.preventDefault();

    const target = event.target;
    const title = target.title;
    const url = target.url;

  },
});

function handleKey(instance){
  return function(e) {
    /*  key codes
        w = 119
        s = 115
        d = 100
        a = 97
    */
    const direction = {100: 'right', 97: 'left'}[e.keyCode];
    console.log('sending to',instance.conn.peer, 'on connection', instance.conn.connectionId, e.key);
    instance.conn.send(e.keyCode);
  }
}
