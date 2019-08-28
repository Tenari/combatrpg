// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Characters } from '../characters.js';

Meteor.publish('characters.fight', function () {
  return Characters.find({userId: Meteor.userId()});
});
