/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/


const {
    System,
    setData,
    getData
} = require('../lib');
const { parsedJid } = require("./client/");


System({
    pattern: "antidelete",
    fromMe: true,
    type: "manage",
    desc: "Manage anti-delete settings",
}, async (message, match) => {
    if(!match) return await message.reply("*Example:*\n\n_*antidelete on/off*_\n_*antidelete jid/chat/pm*_\n");
    const { antidelete } = await getData(message.user.id);
    if (match === "off") {
        const jid = antidelete && antidelete.message ? antidelete.message : "chat";
        await setData(message.user.id, jid, "false", "antidelete");
        await message.reply("_*antidelete disabled*_");
    } else if (match === "on") {
        const jid = antidelete && antidelete.message ? antidelete.message : "chat";
        await setData(message.user.id, jid, "true", "antidelete");
        await message.reply("_*antidelete enabled*_");
    } else {
        const [jid] = await parsedJid(match);
        if (!jid && match !== "chat" && match !== "pm") return await message.reply("*Example:*\n\n_*antidelete on/off*_\n_*antidelete jid/chat/pm*_");
        const status = antidelete?.status || "false";
        await setData(message.user.id, jid || match, status, "antidelete");
        await message.reply(`_*antidelete set to ${jid || match}*_`);
    }
});


System({
    pattern: "antiviewones",
    fromMe: true,
    type: "manage",
    desc: "To get info about promot and demote"
}, async (message, match) => {
    if (match === "on") { 
      const antiviewones = await setData(message.user.id, "active", "true", "antiviewones");
      return await message.send("_*activated*_");
    } else if (match === "off") {
      const antiviewones = await setData(message.user.id, "disactive", "false", "antiviewones");
      return await message.send("_*deactivated*_");
    } else {
      if (!message.isGroup) return message.send("_*antiviewones on/off*_");
      await message.send("\n*Choose a a settings to on/off antiviewones*\n",{ values: [{ displayText: "*on*", id: "antiviewones on" }, { displayText: "*off*", id: "antiviewones off" }], withPrefix: true, participates: [message.sender] }, "poll");
    };
});
