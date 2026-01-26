const ALL_LOCATION = require("./actions/all.locations");
const CREATE_ELON = require("./actions/create.elon");
const getUserLocation = require("./actions/user.location");
const Admins = require("./admin/admin");
const sendChanelIdToAdmin = require("./commands/send.chanel.id.to.admin");
const startCommmand = require("./commands/start");

function botRunner(bot) {
    //start command section
    startCommmand(bot)

    //get location from user 
    getUserLocation(bot)

    // create elon
    CREATE_ELON(bot)

    // all exist locations
    ALL_LOCATION(bot)

    //
    sendChanelIdToAdmin(bot)

    // admin command
    Admins(bot)
}

module.exports = botRunner