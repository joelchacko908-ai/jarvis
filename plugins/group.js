/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/


const {
    bot,
    Vote,
    System,
    config,
    getData,
    setData,
    isPrivate,
    warnMessage
} = require("../lib/");
const { parsedJid, isAdmin, isBotAdmins, getAllGroups, isUrl, sleep, extractUrlsFromText } = require("./client/");

System({
    pattern: 'add',
    type: 'group',
    fromMe: true,
    onlyGroup: true,
    desc: "add a person to group"
}, async (message, match) => {
    match = message.reply_message?.sender || match;
    let isadmin = await isBotAdmins(message);
    if (!isadmin) return await message.reply("_I'm not admin_");
    if (!match) return await message.reply("_Reply to user or need number_\n*Example:* .add 919876543210_");
    match = match.replaceAll(' ', '');
    if (match) {
        let users = match.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let info = await message.client.onWhatsApp(users);
        let ex = info.map((jid) => jid.jid);
        if (!ex.includes(users)) return await message.reply('_*user not found*_');
        const su = await message.client.groupParticipantsUpdate(message.jid, [users], "add");
        if (su[0].status == 403) {
            await message.reply("_Couldn't add. Invite sent!_");
            return await message.sendGroupInviteMessage(users);
        } else if (su[0].status == 408) {
            await message.send(`Couldn't add @${users.split("@")[0]} because they left the group recently. Group invitation sent!`, {
                mentions: [users]
            });
            const code = await message.client.groupInviteCode(message.jid);
            return await message.send(`https://chat.whatsapp.com/${code}`, {}, "text", users);
        } else if (su[0].status == 401) {
            return await message.send(`Couldn't add @${users.split("@")[0]} because they blocked the bot number.`, {
                mentions: [users]
            });
        } else if (su[0].status == 200) {
            return await message.send(`@${users.split("@")[0]}, Added to the group.`, {
                mentions: [users]
            });
        } else if (su[0].status == 409) {
            return await message.send(`@${users.split("@")[0]}, Already in the group.`, {
                mentions: [users]
            });
        } else {
            return await message.reply(JSON.stringify(su));
        }
    }
});


System({
    pattern: "kick",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "Kicks a person from the group"
}, async (message, match) => {
    match = message.mention?.jid?.[0] || message.reply_message?.sender || match;
    if (!match) return await message.reply("_Reply to someone/mention_\n*Example:* .kick @user or kick all");    
    if (!await isBotAdmins(message)) return await message.send("_I'm not an admin_");
    if (match === "all") {
        let { participants } = await message.client.groupMetadata(message.jid);
        participants = participants.filter(p => p.id !== message.user.jid);       
        await message.reply("_To stop this process, use the restart command_");
        for (let key of participants) {
            const jid = parsedJid(key.id);
            await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
	    if(config.KICK_BLOCK) await message.client.updateBlockStatus(jid[0], "block");
            await message.send(`_@${jid[0].split("@")[0]} kicked successfully_`, { mentions: jid });
        }
    } else {
        const jid = parsedJid(match);
        await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
	if(config.KICK_BLOCK) await message.client.updateBlockStatus(jid[0], "block");
        await message.send(`_@${jid[0].split("@")[0]} kicked successfully_`, { mentions: jid, });
    }
});

System({
	pattern: "promote",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "promote a member",
}, async (message, match) => {
	match = message.mention.jid?.[0] || message.reply_message.sender || match
	if (!match) return await message.reply("_Reply to someone/mention_\n*Example:* . promote @user");
	let isadmin = await isBotAdmins(message);
	if (!isadmin) return await message.reply("_I'm not admin_");
	let jid = parsedJid(match);
	await await message.client.groupParticipantsUpdate(message.jid, jid, "promote");
	return await message.send(`_@${jid[0].split("@")[0]} promoted as admin successfully_`, { mentions: jid, });
});


System({
	pattern: "demote",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "demote a member",
}, async (message, match) => {
	match = message.mention.jid?.[0] || message.reply_message.sender || match
	if (!match) return await message.reply("_Reply to someone/mention_\n*Example:* . demote @user");
	let isadmin = await isBotAdmins(message);
	if (!isadmin) return await message.reply("_I'm not admin_");
	let jid = parsedJid(match);
	await await message.client.groupParticipantsUpdate(message.jid, jid, "demote");
	return await message.send(`_@${jid[0].split("@")[0]} demoted from admin successfully_`, { mentions: jid });
});


System({
    pattern: 'invite',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "Provides the group's invitation link."
}, async (message) => {
    let isadmin = await isBotAdmins(message);
    if (!isadmin) return await message.reply("_I'm not admin_");
    const data = await message.client.groupInviteCode(message.jid);
    return await message.reply(`https://chat.whatsapp.com/${data}`);
});


System({
	pattern: "mute",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "nute group",
}, async (message) => {
	let isadmin = await isBotAdmins(message);
	if (!isadmin) return await message.reply("_I'm not admin_");
	const mute = await message.reply("_Muting Group_");
	await sleep(500);
	await message.client.groupSettingUpdate(message.jid, "announcement");
	return await mute.edit("_Group Muted successfully_");
});

System({
	pattern: "unmute",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "unmute group"
}, async (message) => {
	let isadmin = await isBotAdmins(message);
	if (!isadmin) return await message.reply("_I'm not admin_");
	const mute = await message.reply("_Unmuting Group_");
	await sleep(500);
	await message.client.groupSettingUpdate(message.jid, "not_announcement");
	return await mute.edit("_Group Unmuted successfully_");
});

System({
    pattern: "tag",
    fromMe: true,
    type: "group",
    adminAccess: true,
    desc: "mention all users in the group"
}, async (message, match) => {
    if (!message.isGroup) return await message.reply(`@${message.sender.split("@")[0]}`, { mentions: [message.sender], emitOnUpsert: true });   
    const { participants } = await message.client.groupMetadata(message.from).catch(e => {});
    let admins = await participants.filter(v => v.admin !== null).map(v => v.id);
    let msg = "";
    if (match === "all") {
        for (let i = 0; i < participants.length; i++) {
            msg += `${i + 1}. @${participants[i].id.split('@')[0]}\n`;
        }
        await message.send(msg, { mentions: participants.map(a => a.id) });
    } else if (match === "admin" || match === "admins") {
        for (let i = 0; i < admins.length; i++) {
            msg += `${i + 1}. @${admins[i].split('@')[0]}\n`;
        }
        return await message.send(msg, { mentions: admins });
    } else if(match === "everyone") {
	return await message.send('@' + message.from, { contextInfo: { groupMentions: [{ groupJid: message.from, groupSubject: 'everyone' }], mentionedJid: participants?.map(a => a.id) || [] } });
    } else if (match == 'notadmin' || match == 'notadmins' || match == 'not admins' || match == 'not admin' || match == 'non admins' || match == 'non admin') {
      const mentionedJid = participants.filter((user) => !!user.admin != true).map(({ id }) => id)
      mentionedJid.forEach((e) => (msg += `@${e.split('@')[0]}\n`))
      return await message.send(msg.trim(), { contextInfo: { mentionedJid }, });
    } else if (match === "me" || match === "mee") {
        await message.send(`@${message.sender.split("@")[0]}`, { mentions: [message.sender], emitOnUpsert: true });
    } else if (match || message.reply_message.text) {
        match = match || message.reply_message.text;
        if (!match) return await message.reply('*Example :* \n_*tag all*_\n_*tag admin*_\n_*tag text*_\n_*Reply to a message*_');
        await message.send(match, { mentions: participants.map(a => a.id) });
    } else if (message.quoted) {
        return await message.client.forwardMessage(message.jid, message.reply_message.message, { contextInfo: { mentionedJid: participants.map(a => a.id) } });
    } else {
        return await message.reply("*Example :* \n_*tag all*_\n_*tag admin*_\n_*tag me*_\n_*tag text*_\n_*Reply to a message to tag that message*_");
    }
});

System({
    pattern: "gpp",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "Set full-screen profile picture",
}, async (message, match) => {
    let isadmin = await isBotAdmins(message);
    if (!isadmin) return await message.reply("_I'm not an admin_");
    if(match && match === "remove") {
        await message.client.removeProfilePicture(message.jid);
        return await message.reply("_Group Profile Picture Removed_");
    }
    if (!message.reply_message?.image) return await message.reply("_Reply to a photo_");
    const media = await message.reply_message.download();
    await message.client.updateProfile(media, message.jid);
    return await message.send("_Group Profile Picture Updated_");
});

System({
    pattern: 'revoke',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "Revoke Group invite link.",
}, async (message) => {
    let isadmin = await isBotAdmins(message);
    if (!isadmin) return await message.reply("_I'm not admin_");
    await message.client.groupRevokeInvite(message.jid)
    await message.send('_Revoked_');
});

System({
    pattern: 'join',
    fromMe: true,
    desc: "to join a group",
    type: 'group'
}, async (message, match) => {
   match = (await extractUrlsFromText(match || message.reply_message.text))[0];
   if(!match) return await message.reply('_Enter a valid group link!_');
   if(!isUrl(match)) return await message.send('_Enter a valid group link!_');
   if(!match) return await message.send('_Enter a valid group link!_');
   if (match && match.includes('chat.whatsapp.com')) {
       const groupCode = match.split('https://chat.whatsapp.com/')[1];
       const joinResult = await message.client.groupAcceptInvite(groupCode);
       if (joinResult) return await message.reply('_Joined!_'); 
           await message.reply('_Invalid Group Link!_'); 
   } else {
       await message.reply('_Invalid Group Link!_'); 
   }
});

System({
    pattern: 'left',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    desc: 'Left from group'
}, async (message) => {
    await message.client.groupLeave(message.jid);
});

System({
    pattern: 'lock',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "only allow admins to modify the group's settings",
}, async (message, match) => {
    let isadmin = await isBotAdmins(message);
    if (!isadmin) return await message.reply("_I'm not admin_");
    const meta = await message.client.groupMetadata(message.chat)
    if (meta.restrict) return await message.send("_Already only admin can modify group settings_")
    await message.client.groupSettingUpdate(message.jid, 'locked')
    return await message.send("*Only admin can modify group settings*")
});

System({
    pattern: 'unlock',
    fromMe: true,
    type: 'group',	
    onlyGroup: true,
    desc: "allow everyone to modify the group's settings -- like display picture etc.",
}, async (message, match) => {
    let isadmin = await isBotAdmins(message);
    if (!isadmin) return await message.reply("_bot not admin_");
    const meta = await message.client.groupMetadata(message.jid);
    if (!meta.restrict) return await message.send("_Already everyone can modify group settings_")
    await message.client.groupSettingUpdate(message.jid, 'unlocked')
    return await message.send("*Everyone can modify group settings*")
});


System({
	pattern: 'gname',
	fromMe: true,
	type: 'group',
	onlyGroup: true,
	adminAccess: true,
	desc: "To change the group's subject",
}, async (message, match) => {
	match = match || message.reply_message.text
	if (!match) return await message.reply('*Need Subject!*\n*Example: gname New Subject!*.')
	const meta = await message.client.groupMetadata(message.chat);
	if (!meta.restrict) {
		await message.client.groupUpdateSubject(message.chat, match)
		return await message.send("*Subject updated*")
	}
	const isbotAdmin = await isBotAdmins(message);
	if (!isbotAdmin) return await message.reply("I'm not an admin")
	await message.client.groupUpdateSubject(message.chat, match)
	return await message.send("*Subject updated*")
});

System({
    pattern: 'gdesc',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "To change the group's description",
}, async (message, match) => {
    match = match || message.reply_message.text
    if (!match) return await message.reply('*Need Description!*\n*Example: gdesc New Description!*.')
    const meta = await message.client.groupMetadata(message.jid);
    if (!meta.restrict) {
      await message.client.groupUpdateDescription(message.jid, match)
      return await message.send("_*Description updated*_")
    }
    const isbotAdmin = await isBotAdmins(message);
    if (!isbotAdmin) return await message.send("_I'm not an admin_")
    await message.client.groupUpdateDescription(message.jid, match)
    return await message.send("_*Description updated*_")
})

System({
    pattern: 'gjid',
    fromMe: true,
    type: 'group',
    desc: "To get group jid"
}, async (message, match) => {
    match = match || message.reply_message.text;
    if (!message.isGroup || match === "info") return message.send(`*All Group Jid*\n${await getAllGroups(message.client)}`);    
    if (match === "participants jid") {
        const { participants, subject } = await message.client.groupMetadata(message.jid);
        const participantJids = participants.map(u => u.id).join("\n\n")
        return message.reply(`*Group Participants Jid*\n\n*Group Name:* ${subject}\n*All Participants Jid*\n\n${participantJids}`);
    };
    await message.send("\n*Group Jid Info 🎏*\n", { values: [ { displayText: "*All Group Info*", id: "gjid info" }, { displayText: "*Group Participants Jid*", id: "gjid participants jid" } ], withPrefix: true, participates: [message.sender] }, "poll");
});


System({
    pattern: 'ginfo',
    fromMe: true,
    type: 'group',
    desc: 'Shows group invite info',
}, async (message, match) => {
    match = (await extractUrlsFromText(match || message.reply_message.text))[0];
    if(!match && message.isGroup) match = `https://chat.whatsapp.com/${await message.client.groupInviteCode(message.jid)}`;
    if (!match) return await message.reply('*Need Group Link*\n_Example : ginfo group link_')
    const [link, invite] = match.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i) || []
    if (!invite) return await message.reply('*Invalid invite link*');
    const response = await message.groupInviteInfo(invite);
    if(!response) return await message.reply('*Invalid invite link*');
    const profile = await message.getPP(response.id);
    await message.send(profile, { caption: "id: " + response.id + "\nsubject: " + response.subject + "\nowner: " + `${response.owner ? response.owner.split('@')[0] : 'unknown'}` + "\nsize: " + response.size + "\nrestrict: " + response.restrict + "\nannounce: " + response.announce + "\ncreation: " + require('moment-timezone')(response.creation * 1000).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm:ss') + "\ndesc: " + response.desc }, "image");
})

System({
    pattern: "create",
    fromMe: true,
    desc: "to create a group",
    type: "group",
}, async (m, match) => {
    let gName = match || m.pushName;
    if (!m.reply_message.sender) return m.reply("*To create group with someone*\n_Example : . create @user/reply_");
    const group = await m.client.groupCreate(gName, [m.reply_message.sender, m.sender]);
    await m.send("_Group successfully created_ ");
});

System({
	pattern: "warn",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "Warn a user",
}, async (message, match) => {
        let user = message.mention.jid?.[0] || message.reply_message.sender;
	if (!user) return message.reply("_Reply to someone/mention_\n*Example:* . warn @user\n_To reset warn_\n*Example:* .warn reset");
	const jid = parsedJid(user);
	let isBotAdmin = await isBotAdmins(message);
	if(!isBotAdmin) return await message.reply("_I'm not admin_");
	let userIsAdmin = await isAdmin(message, user);
	if(userIsAdmin) return await message.send(`_user is admin @${jid[0].split("@")[0]}_`, { mentions: jid });
	const name = await message.store.getName(user);
       await warnMessage(message, match, user, name);
});

System({
    pattern: "inactive", 
    fromMe: isPrivate,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "To check inactive users in group", 
}, async (message, match) => {
    const data = await message.store.groupStatus(message.chat, "disactive");
    let inactiveUsers = Array.isArray(data) ? `*Total Inactive Users ${data.length}*\n\n` + data.map((item, index) => `*${index + 1}. User: @${item.jid.split("@")[0]}*\n*Role: ${item.role}*\n\n`).join("") : "_*No inactive users found.*_";
    return await message.send(inactiveUsers.trim(), { mentions: data.map(a => a.jid) || [] });
});


System({
    pattern: "active", 
    fromMe: isPrivate,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "To check active users in group", 
}, async (message, match) => {
    const data = await message.store.groupStatus(message.jid, "active");
    let activeUsers = Array.isArray(data) ? `*Total Active Users ${data.length}*\n\n` + data.map(item => `*Name: ${item.pushName}*\n*Number: ${item.jid.split("@")[0]}*\n*Total Messages: ${item.messageCount}*\n\n`).join("") : "_*No active users found.*_";
    return await message.send(activeUsers.trim());
});

System({
    pattern: "vote",
    fromMe: isPrivate,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "to send a vote message"
}, async (message, match) => {
    let formattedResult;
    if (!match) return message.reply("*Hey, where's the vote text?* Or you can use: _'vote result'_ or _'vote get'_ to get the result of a vote, _'vote delete'_ to delete a vote message, or _'vote What's your favorite color?;😂|Blue,😟|Red'_ to create a vote.");
    if (match === "delete") {
    if (!message.quoted) return message.reply("_*Reply to a vote message*_");
    const deleted = await Vote(message, {}, "delete");
    if (!deleted) return message.reply("*Vote message not found*");
      await message.send({ key: message.reply_message.data.key }, {}, 'delete');
      await message.reply("*Vote message successfully deleted*");
    } else if (match === "result" || match === "get") {
      if (!message.quoted) return message.reply("_*Reply to a vote message*_");
      const data = await Vote(message, {}, "result");
      if (!data) return message.reply("*It's not a vote message or it's patched*");
      if (data.result.length === 0) {
      formattedResult = ['_*No votes yet.*_'];
    } else {
      formattedResult = data.result.map(({ Emoji, Votes, Percentage, VotesBy, VotedOn }) => {
      const votersList = VotesBy.map(voter => `@${voter.split("@")[0]}`).join('\n');
      return `*Emoji*: ${Emoji}\n*Voted On*: ${VotedOn}\n*Total Votes:* ${Votes}\n*Percentage:* ${Percentage}\n*Votes By:* ${votersList}\n\n`;
      });
    } if (data.result.length > 0) formattedResult.unshift('*Vote Result ✨*\n\n');
      await message.send(formattedResult.join('').trim(), { mentions: data.votersJid })
    } else {
      const regex = /^([^;]*;[^;]*\|[^;]*,[^;]*\|[^;]*)$/;
      if (!regex.test(match)) return message.reply("*The text is not in the correct format. Use* ```What's your favorite color?;😂|Blue,😟|Red```");
      await Vote(message, { text: match }, "vote");
    }
});

System({
    pattern: "automute",
    fromMe: true,
    onlyGroup: true,
    type: 'manage',
    adminAccess: true,
    desc: "auto mute groups"
}, async (message, match) => {
   match = match?.toUpperCase();
   const { autoMute } = await getData(message.chat);
   const action = autoMute && autoMute.message ? autoMute.message : 'null';
   if (!match) return await message.send("*Wrong format!*\n *.automute 10:00 PM*\n *.automute 06:00 AM*\n *.automute off*");
   if (match.toLowerCase() === "off") {
      await setData(message.jid, action, "false", "autoMute");
      return await message.send("*Automute has been disabled in this group ❗*");       
   } else if (match.toLowerCase() === "on") {
      await setData(message.jid, action, "true", "autoMute");
      return await message.send("*Automute has been enabled in this group ✅*");       
   };
   var admin = await isBotAdmins(message);
   if (!admin) return await message.send("_I'm not an admin_");
   await setData(message.jid, match, "true", "autoMute");
   await message.send(`*_Group will auto mute at ${match}, rebooting.._*`);
   bot.restart();
});

System({
    pattern: "autounmute",
    fromMe: true,
    type: 'manage',
    onlyGroup: true,
    adminAccess: true,
    desc: "auto mute groups",
}, async (message, match) => {
   match = match?.toUpperCase();
   const { autoUnmute } = await getData(message.chat);
   const action = autoUnmute && autoUnmute.message ? autoUnmute.message : 'null';
   if (!match) return await message.send("*Wrong format!*\n *.autounmute 10:00 PM*\n *.autounmute 06:00 AM*\n *.autounmute off*");
   if (match.toLowerCase() === "off") {
      await setData(message.jid, action, "false", "autoUnmute");
      return await message.send("*Autounmute has been disabled in this group ❗*");       
   } else if (match.toLowerCase() === "on") {
      await setData(message.jid, action, "true", "autoUnmute");
      return await message.send("*Autounmute has been enabled in this group ✅*");       
   };
   var admin = await isBotAdmins(message);
   if (!admin) return await message.send("_I'm not an admin_");
   await setData(message.jid, match, "true", "autoUnmute");
   await message.send(`*_Group will auto unmute at ${match}, rebooting.._*`)
   bot.restart();
});

System({
    pattern: "getmute",
    fromMe: true,
    type: 'manage',
    onlyGroup: true,
    adminAccess: true,
    desc: "mute/unmute group info"
}, async (message, match) => {
   const { autoMute, autoUnmute } = await getData(message.jid);
   if ((!autoMute || autoMute.status === "false") && (!autoUnmute || autoUnmute.status === "false")) return message.reply("*Auto mute and Auto unmute not set yet*");
   let msg = [autoMute?.status === "true" ? `*⬦ Auto Mute Set As:* ${autoMute.message}` : "", autoUnmute?.status === "true" ? `*⬦ Auto Unmute Set As:* ${autoUnmute.message}` : ""].filter(Boolean).join("\n");
   return message.reply("*Scheduled Mutes/Unmutes*\n\n" + msg);
});

System({
    pattern: "glist",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: 'list group join requests'
}, async (message, match) => {
   const result = await message.client.groupRequestParticipantsList(message.jid);
   if (!result.length) return await message.send('_*no pending requests*_');
   await message.send("*pending requests list*\n\n" + result.map((id) => `+${id.jid.split('@')[0]}`).join('\n'));
});

System({
    pattern: "gapprove",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: 'accept all group join request',
}, async (message, match) => {
    if (!(await isBotAdmins(message))) return await message.send("_I'm not an admin_");
    if (!match) return await message.reply("_Provide a match, e.g., gapprove all or gapprove: 917025673121, 4915147867879_");
    const result = await message.client.groupRequestParticipantsList(message.jid);
    if (!result.length) return await message.send('_*No pending requests*_');
    const jids = match === "all" ? result.map(id => id.jid) : match.split(',').map(num => num.trim().replace(/\+/g, '').replace(/\s/g, '') + '@s.whatsapp.net').filter(jid => jid !== '@s.whatsapp.net'); 
    for (const jid of jids) {
        if (!result.map(id => id.jid).includes(jid)) return await message.send(`_*+${jid.split('@')[0]} is not required*_`);
        await message.client.groupRequestParticipantsUpdate(message.jid, [jid], 'approve');
        await sleep(800);
    };
    await message.send(match === "all" ? '_*Approved all*_' : '_*Approved selected members*_');
});

System({
    pattern: "greject",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: 'reject all group request',
}, async (message, match) => {
    if (!(await isBotAdmins(message))) return await message.send("_I'm not an admin_");
    if (!match) return await message.reply("_Provide a match, e.g., greject all or greject 917025673121, 4915147867879_");
    const result = await message.client.groupRequestParticipantsList(message.jid);
    if (!result.length) return await message.send('_*No pending requests*_');
    const jids = match === "all" ? result.map(id => id.jid) : match.split(',').map(num => num.trim().replace(/\+/g, '').replace(/\s/g, '') + '@s.whatsapp.net').filter(jid => jid !== '@s.whatsapp.net'); 
    for (const jid of jids) {
        if (!result.map(id => id.jid).includes(jid)) return await message.send(`_*+${jid.split('@')[0]} is not required*_`);
        await message.client.groupRequestParticipantsUpdate(message.jid, [jid], 'reject');
        await sleep(800);
    };
    await message.send(match === "all" ? '_*Reject all*_' : '_*Reject selected members*_');
});

System({
    pattern: "gadd",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "Set who can add members to the group (all / admin)"
}, async (message, match) => {
    if (!await isBotAdmins(message)) return await message.reply("_I'm not admin_");
    match = match?.trim().toLowerCase();
    const modes = { all: "all_member_add", admin: "admin_add", admins: "admin_add" };
    if (!match) {
        return await message.send("\n*Who can add members? 👥*\n", {
            values: [
                { displayText: "*All Members*", id: "gadd all" },
                { displayText: "*Only Admins*", id: "gadd admin" }
            ],
            withPrefix: true,
            participates: [message.sender]
        }, "poll");
    }
    if (!modes[match]) return await message.reply("*Example:*\n_.memberadd all_ (everyone can add)\n_.memberadd admin_ (only admins can add)");
    await message.client.groupMemberAddMode(message.jid, modes[match]);
    return await message.send(match === "all" ? "*Everyone can add members now :)*" : "*Only admins can add members now !*");
});
