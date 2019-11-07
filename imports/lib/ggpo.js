import { Network } from '/imports/lib/network.js';
import { BUTTONS } from '/imports/config/moves.js';
/* callbacks is an object of {key: function} which should contain the following:
     begin_game
     advance_frame
     load_game_state
     save_game_state
     free_buffer
     on_event
*/
export function GGPO(options, callbacks) {
  options = _.extend({
    ROLLBACK_MAX_FRAMES: 8,   // The maximum number of frames we allow the game run forward without a confirmed frame from the opponent
    INPUT_HISTORY_SIZE: 50,   // how many frames of history to save
    SEND_HISTORY_SIZE: 5,     // the number of frames of history to send every time we send input history to the remote clients
    playerIds: [], // this should be a list of _id that match the character objects
    remotePlayerId: null,     // MANDATORY. this must be passed in with the id of the remote player or we will not be able to function
    localPlayerId: null,      // MANDATORY. this must be passed in with the id of the local player or we will not be able to function
    fightEngine: null,        // MANDATORY.
  }, options || {});

  var MSG_TYPES = {
    handshake: 1,
    playerInput: 2,
    ping: 3,
    pong: 4,
    sync: 5,
  }

  var that = this;
  this.inputHistory = {};
  _.each(options.playerIds, function(id){
    that.inputHistory[id] = [];
  })
  // Input encoding + decoding
  var INPUT_CODES = {}; // map of keyCode to binary flag value
  // defaults to recognizing WASD keyCodes
  _.each(_.values(BUTTONS) || [87,65,83,68], function(code, index){
    INPUT_CODES[code] = 2 ** index; // 2 ^ index for binary increasing
  })
  this.tick = 0;
  this.lastRemoteInputReceivedAt = -1;      // the last tick at which we recieved a remoteInput, is updated immediately upon reciept of new input packets
  this.firstPredictedRemoteInputTick = -1;  // the first tick when we had to predict an input. updated everytime we predit a new input
  this.predictions = [];                    // a ring buffer storing the predictions we are forced to make, so we can compare when we get the real inputs
  this.lastSavedState = null;
  this.net = new Network(this, {
    SEND_HISTORY_SIZE: options.SEND_HISTORY_SIZE,
    INPUT_HISTORY_SIZE: options.INPUT_HISTORY_SIZE,
  });

  /////////////// PUBLIC FUNCTIONS ///////////////////////////////////

  // saves the new inputNumber and sends it to remotes
  this.addLocalInput = function(id, inputObj){
    const inputNumber = this.encodeInput(inputObj);
    // save the new input
    this.inputHistory[id][this.tick % options.INPUT_HISTORY_SIZE] = inputNumber;
    // send it to the other player(s)
    this.net.sendInputPacket(this.inputHistory, id, this.tick);
  }

  // this.net should call this when it recieves new input from the remote in the receiveData() function
  this.addRemoteInput = function(tick, inputNumber) {
    if (tick > this.lastRemoteInputReceivedAt) {
      this.lastRemoteInputReceivedAt = tick;
    }
    this.inputHistory[options.remotePlayerId][tick % options.INPUT_HISTORY_SIZE] = inputNumber;
  }

  // returns an object mapping player ids to inputObjects for the current frame.
  // sometimes these inputNumbers will be predictions (and thus potentially wrong)
  // the fightEngine should use these inputs to calculate the next frame
  this.getInputs = function(){
//        check and see if a new remoteInput has come in
//          if the new remoteInput does not match the predicted remoteInput for the (past) frame, ROLLBACK
//            rollback to the offending frame (load_game_state)
//            until we are caught back up,
//              call advanceGameState(inputs) with corrected input/new predicted input
//            return localInput for this frame and predictedRemoteInput for this frame
//          else (the new remoteInput DID match our predictions)
//            return localInput for this frame and predictedRemoteInput for this frame
//        else
//          predict remoteInput for this frame
//        return localInput for this frame and remoteInput for this frame
   if (!this.lastSavedState) { // should only be on the first tick
     this.lastSavedState = options.fightEngine.saveState();
   }

    const presentTick = this.tick;
    let remoteInput = 0;
    let localInput = this.inputHistory[options.localPlayerId][this.tick % options.INPUT_HISTORY_SIZE];
    // check and see if a new remoteInput has come in
    if (this.lastRemoteInputReceivedAt != -1 && this.lastRemoteInputReceivedAt >= this.firstPredictedRemoteInputTick) {
      // if the new remoteInput does not match the predicted remoteInput for the (past) frame, ROLLBACK
      if (this.inputPredictionMismatch()) {
        options.fightEngine.loadState(this.lastSavedState); // ROLLBACK
        this.tick = this.lastSavedState.tick;
        this.firstPredictedRemoteInputTick = -1; // reset this to the null value, so that predictNextInput() will overwrite it the first time it actually predicts something
        // now, for each frame we rolled back, generate the inputs and re-simulate the game
        while (this.tick < presentTick) {
          let inputs = {};
          // save the state of the engine at the most recently "valid" tick
          if (this.tick == this.lastRemoteInputReceivedAt) {
            this.lastSavedState = options.fightEngine.saveState();
          }
          inputs[options.localPlayerId] = this.decodeInput(this.inputHistory[options.localPlayerId][this.tick % options.INPUT_HISTORY_SIZE]);
          inputs[options.remotePlayerId] = this.decodeInput(this.predictNextInput());
          options.fightEngine.advanceGameState(inputs)
          this.tick += 1;
        }
      } // else our predictions matched the actual input! yay
    } 
    // whether this is a prediction mismatch or not we need to end this block with this call, since we need to figure out the input for the next tick
    remoteInput = this.predictNextInput(); // so just predict the next input and we're done

    this.tick += 1;

    return {
      [options.remotePlayerId]: this.decodeInput(remoteInput),
      [options.localPlayerId]: this.decodeInput(localInput),
    };
  }

  // true if we have predicted ROLLBACK_MAX_FRAMES times in a row. continuing to predict from here on is stupid. just wait for the network
  this.shouldWait = function(){
    return this.tick - this.lastRemoteInputReceivedAt > options.ROLLBACK_MAX_FRAMES;
  }

  ////////////////// PRIVATE FUNCTIONS (HELPERS) //////////////////////

  // Encodes the player input state into a compact form for network transmission.
  this.encodeInput = function(inputs) { // inputs is an object of {keyCode : boolean}
    // the basic idea is to just send one number over the network representing the entire input state
    var state = 0;
    _.each(inputs, function(down, keyCode) {
      if (down && INPUT_CODES[keyCode])
        state = state | INPUT_CODES[keyCode];
    })
    return state;
  }
  // takes a single state number and translates it into an object of {keyCode : boolean}
  this.decodeInput = function(state) {
    var inputs = {};
    _.each(INPUT_CODES, function(binary, code) {
      if (state & binary) inputs[code] = true;
    })
    return inputs;
  }
  
  // returns true if the inputNumber at lastRemoteInputReceivedAt DOES NOT MATCH the inputNumber in the predictions buffer
  this.inputPredictionMismatch = function(){
    const ticksToCheck = this.lastRemoteInputReceivedAt - this.firstPredictedRemoteInputTick;
    let mismatch = false;
    for (let i = 0; i < ticksToCheck; i += 1) {
      let index = (this.firstPredictedRemoteInputTick + i) % options.INPUT_HISTORY_SIZE;
      if (this.predictions[index] && this.predictions[index] != this.inputHistory[options.remotePlayerId][index]) { // MISMATCH
        mismatch = true;
        i = ticksToCheck; // dont need to check the rest
      }
    }
    return mismatch;
  }

  this.predictNextInput = function(){
    if (!options.remotePlayerId) throw "MISSING MANDATORY FIELD: options.remotePlayerId";

    if (this.tick <= this.lastRemoteInputReceivedAt) { // if we actually have the real remote input, we don't actuall need to predict, so just return the real input
      this.predictions[this.tick % options.INPUT_HISTORY_SIZE] = null; // we did not make a prediction, so record that
      return this.inputHistory[options.remotePlayerId][this.tick % options.INPUT_HISTORY_SIZE];
    }

    // predict the previous frame or (0 (for nothing) if it's the first frame)
    const prediction = this.inputHistory[options.remotePlayerId][(this.tick-1) % options.INPUT_HISTORY_SIZE] || 0;
    this.predictions[this.tick % options.INPUT_HISTORY_SIZE] = prediction; // save the prediction for checking if it matches input later
    if (this.firstPredictedRemoteInputTick == -1) {
      this.firstPredictedRemoteInputTick = this.tick;
    }
    return prediction;
  }

}
