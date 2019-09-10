import { Meteor } from 'meteor/meteor';
import Konva from 'konva';
import { Fights } from '/imports/api/fights/fights.js';
import { Characters } from '/imports/api/characters/characters.js';
import { animations } from '/imports/config/animation.js';
import './fight.html';

Template.fight.onCreated(function () {
  this.subscribe('fights.all');
  this.layers = [];
  this.characters = {};
  $(window).on('keypress', handleKey(this));

  this.autorun(() => {
    const character = Characters.findOne({userId: Meteor.userId()});
    const fight = Fights.findOne({characters: character._id});
    if (fight) {
      if (!this.stage) {
        setupFight(this, fight);
      } else {
        let instance = this;
        _.each(fight.elements, function(details){
          if (details.type == 'character' && instance.characters[details.id]) {
            instance.characters[details.id].x(details.x);
            instance.characters[details.id].y(details.y);
            instance.characters[details.id].frameIndex(details.frameIndex);
            instance.characters[details.id].getLayer().draw();
          }
        });
      }
    }
  })
});
Template.fight.onDestroyed(function () {
  $(window).off('keypress', handleKey(this))
});

function setupFight(instance, fight){
  instance.stage = new Konva.Stage({
    container: 'fight',   // id of container <div>
    width: 800,
    height: 600
  });

  _.each(fight.elements, function(details){
    if (details.type == 'character') {
      let layer = new Konva.Layer();
      instance.layers.push(layer);
      var imageObj = new Image();
      imageObj.onload = function() {
        //https://konvajs.org/docs/shapes/Sprite.html
        let character = new Konva.Sprite({
          x: details.x,
          y: 50,
          image: imageObj,
          animation: 'idle',
          animations: animations,
          frameRate: 1,
          frameIndex: 0
        });

        // add the shape to the layer
        layer.add(character);

        // add the layer to the stage
        instance.stage.add(layer);

        // start sprite animation
        character.start();
        instance.characters[details.id] = character;
        layer.draw();
      };
      imageObj.src = '/stand_sprites.png';
    } else if (details.type == 'floor') {
    }
  })
  instance.stage.draw();
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
    Meteor.call('fights.move', direction);
  }
}
