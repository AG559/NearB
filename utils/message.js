const moment = require("moment")

const formatMessage = (user,message)=>{
    return {
        username : user,
        text:message,
        time: moment().format("hh:mm a")
    }
}

module.exports =formatMessage;