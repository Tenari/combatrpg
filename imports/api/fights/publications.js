import { Meteor } from 'meteor/meteor';
import { Fights } from './fights.js';

Meteor.publish('fights.all', function () {
  return Fights.find();
});

