import './home.html';

import '../../components/hello/hello.js';
import '../../components/fight/fight.js';

import { Characters } from '/imports/api/characters/characters.js';

Template.App_home.onCreated(function(){
  this.subscribe('characters.fight');
})
Template.App_home.helpers({
  hasCharacter(){
    return Characters.findOne();
  }
})
Template.App_home.events({
  "click button.create-character"(e, instance){
    Meteor.call('characters.insert');
  }
})
