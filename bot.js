const ALL_LOCATION = require("./callbacks/all.locations");
const CREATE_ELON = require("./callbacks/create.elon");
const getUserLocation = require("./callbacks/user.location");
const startCommmand = require("./commands/start");

function botRunner(bot) {
    //start command section
    startCommmand(bot)

    //get location from user 
    getUserLocation(bot)

    // create elon
    CREATE_ELON(bot)

    //all exist locations
    ALL_LOCATION(bot)
}

module.exports = botRunner