const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    _id: String,
    clients: Array,
    numberOfBoards: Number,
    numberOfPlayers: Number,
    state: Object,
    activePlayer: Number
},
{ retainKeyOrder: true, minimize: false }
);

module.exports = mongoose.model('Game', GameSchema);