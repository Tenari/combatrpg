import { Meteor } from 'meteor/meteor';
import Peer from 'peerjs';
import { FightEngine } from '/imports/lib/fightEngine.js';
import { GGPO } from '/imports/lib/ggpo.js';
import { Fights } from '/imports/api/fights/fights.js';
import { Characters } from '/imports/api/characters/characters.js';
import { BUTTONS } from '/imports/config/moves.js';
import './fight.html';

Template.fight.onDestroyed(function () {
  $(window).off('keydown', handleKey(this))
  $(window).off('keyup', handleKey(this))
});
Template.fight.onCreated(function () {
  this.subscribe('fights.all');
  $(window).on('keydown', handleKey(this));
  $(window).on('keyup', handleKey(this));
  this.localInput = {}; // {keyCode: boolean} mapping

  this.autorun(() => {
    var instance = this;
    const character = Characters.findOne({userId: Meteor.userId()});
    instance.character = character;
    if (!character) return false;

    instance.fight = Fights.findOne({characters: character._id});
    const fight = instance.fight;
    if (!fight) return false;
    const remoteCharacterId = _.find(fight.characters, function(cid){ return cid != character._id});

    if (!this.ggpo) {
      // fight contains the details about what entities are in the fight and the level + background etc, which are used to initialize the fight engine
      this.fightEngine = new FightEngine(fight, character, $('#fight'));
      this.ggpo = new GGPO({playerIds: fight.characters, remotePlayerId: remoteCharacterId, localPlayerId: character._id, fightEngine: this.fightEngine});
    }

    if (!instance.peer) {
      // setup peerJS connection
      instance.peer = new Peer(character._id, {host: 'localhost', port: 9000, path: '/myapp'});
      console.log('my peer id', character._id);
      instance.peer.on('connection', function(conn){
        instance.ggpo.net.connection = conn;
        conn.on('data', function(){ instance.ggpo.net.receiveData.apply(instance.ggpo.net, arguments); });
      })
    }
    //first handle networking or ai initialization
    // fight is either with monster or player
    if (fight.characters.length > 1) { // two characters => peerJS connection
      if (!instance.ggpo.net.connection) {
        instance.ggpo.net.connection = instance.peer.connect(remoteCharacterId);
        instance.ggpo.net.connection.on('data', function(){ instance.ggpo.net.receiveData.apply(instance.ggpo.net, arguments); });
        if (fight.characters[0] == character._id) { //first character isServer
          instance.ggpo.net.startServer();
        } else {
          instance.ggpo.net.startConnection();
        }
      }
    } else {
      // TODO ai monster opponent initialization
    }

    // then handle fight ui initialization
    setupFight(instance);
  })
});

function setupFight(instance){
  window.setInterval(function(){
    //console.log(instance.ggpo.tick, instance.fightEngine.tick, instance.ggpo.lastRemoteInputReceivedAt);
    if (!instance.ggpo.net.connection) return false;
    if (!instance.ggpo.net.connectedToClient) {
      instance.ggpo.net.handshakeConnect();
    }
    if (!instance.ggpo.net.enabled) return false;
    //if (instance.ggpo.tick > 100) return false;

    instance.ggpo.net.processDelayedPackets();
    if (!instance.ggpo.net.connectedToClient) return false;

    if (instance.ggpo.shouldWait()) return false;

    instance.ggpo.addLocalInput(instance.character._id, instance.localInput);

    const inputsForThisTick = instance.ggpo.getInputs();
    instance.fightEngine.advanceGameState(inputsForThisTick);
    instance.fightEngine.render();
  }, 20)
  /*
  window.setInterval(function(){
//    console.log(instance.tick, instance.network.connection.connectionId, instance.network.enabled, instance.network.connectedToClient);
    if (!instance.network.connection) return false;
    if (!instance.network.connectedToClient) {
      instance.network.handshakeConnect();
    }
    if (instance.tick > 100) return false;

    const lastGameTick = instance.tick;
    let updateGame = false;
    //if ROLLBACK_TEST_ENABLED then
    //  updateGame = true
    //end
    if (instance.network.enabled) {
      const time = new Date().getTime();
      // Send any packets that have been queued
      instance.network.processDelayedPackets();

      if (instance.network.connectedToClient) {
        // Run any rollbacks that can be processed before the next game update
        instance.fightEngine.handleRollbacks(lastGameTick-1, instance.network)

        // Calculate the difference between remote game tick and the local. This will be used for syncing.
        // We don't use the latest local tick, but the tick for the latest input sent to the remote client.
        instance.network.localTickDelta = (lastGameTick + instance.network.INPUT_DELAY) - instance.network.confirmedTick;

        //TODO graphTable[ 1 + (lastGameTick % 60) * 2 + 1  ] = -1*(Network.localTickDelta - Network.remoteTickDelta) * 5

        // Prevent updating the game when the tick difference is greater on this end.
        // This allows the game deltas to be off by atleast on frame. Our timing is only accurate to one frame so any slight increase in network latency
        // would cause the game to constantly hold. You could increase this tolerance, but this would increase the advantage for one player over the other
        const hold = (instance.network.localTickDelta - instance.network.remoteTickDelta) > 2

        // Hold until the tick deltas match.
        if (hold) {
          updateGame = false;
        } else {
          // We allow the game to run for ROLLBACK_MAX_FRAMES updates without having input for the current frame.
          // Once the game can no longer update, it will wait until the other player's client can catch up.
          if (lastGameTick <= (instance.network.confirmedTick + instance.network.ROLLBACK_MAX_FRAMES)) {
            updateGame = true;
          } else {
            updateGame = false;
          }
        }
      }
    }

    if (updateGame) {
      // Test rollbacks
      //TestRollbacks()

      if (instance.network.enabled) {
        // Update local input history
        instance.network.setLocalInput(instance.localInput, lastGameTick + instance.network.INPUT_DELAY);

        instance.fightEngine.update(instance.network, lastGameTick) // means update the game world 1 tick forward.
        instance.tick += 1;
      }

      //// Save stage after an update if testing rollbacks
      //if ROLLBACK_TEST_ENABLED then
      //// Save local input history for this game tick
      //Network:SetLocalInput(InputSystem:GetLatestInput(InputSystem.localPlayerIndex), lastGameTick)
      //end


      if (instance.network.enabled) {
        // Check whether or not the game state is confirmed to be in sync.
        // Since we previously rolled back, it's safe to set the lastSyncedTick here since we know any previous frames will be synced.
        if ((instance.network.lastSyncedTick + 1) == lastGameTick && lastGameTick <= instance.network.confirmedTick) {
          // Increment the synced tick number if we have inputs
          instance.network.lastSyncedTick = lastGameTick;

          // Applied the remote player's input, so this game frame should synced.
          instance.fightEngine.storeState();

          // Confirm the game clients are in sync
          instance.fightEngine.syncCheck();
        }
      }
    }
    // send the input from our local player and test latency
    if (instance.network.enabled && instance.network.connectedToClient) {
      instance.network.sendInputData(lastGameTick + instance.network.INPUT_DELAY);

      // Send ping so we can test network latency, every 3rd frame
      if (lastGameTick % 3 == 0) {
        instance.network.sendPingMessage();
      }
    }
  }, 20)
  */
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
//    console.log('sending to',instance.network.connection.peer, 'on connection', instance.network.connection.connectionId, e.key);
    instance.localInput[e.keyCode] = e.type == 'keydown';
  }
}
