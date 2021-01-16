import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Characters } from '/imports/api/characters/characters.js';
import { Fights } from './fights.js';

Meteor.methods({
  'fights.move'(direction) {
    const character = Characters.findOne({userId: Meteor.userId()});
    let fight = Fights.findOne({characters: character._id})
    let elem = _.find(fight.elements, function(elem){ return elem.type == 'character' && elem.id == character._id});
    if (direction == 'left') {
      elem.x -= 10;
    } else {
      elem.x += 10;
    }
    Fights.update(fight._id, fight);
  },
  'fights.offer'(id, sig) {
    Fights.update(id, {$set:{offer: sig, offeredAt: Date.now()}})
  },
  'fights.answer'(id, sig) {
    Fights.update(id, {$set:{answer: sig, answeredAt: Date.now()}})
  },
  'fights.usedOffer'(id) {
    Fights.update(id, {$unset:{offer: ""}})
  },
  'fights.usedAnswer'(id) {
    Fights.update(id, {$unset:{answer: ""}})
  },
  'fights.connected'(id) {
    Fights.update(id, {$unset:{answer: "", offer: ""}})
  },
});
