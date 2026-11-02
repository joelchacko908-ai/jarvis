/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/

const { System, isPrivate, spotifyMetaData } = require("../lib/");
const { extractUrlsFromText } = require('./client/');

System({
  pattern: 'spotify',
  fromMe: isPrivate,
  type: 'download',
  desc: 'Downloads song from Spotify'
}, async (message, match, m) => {
  const link = (await extractUrlsFromText(match || message.reply_message.text))[0];
  if (!link || !link.includes('spotify')) return await message.reply("_Give a valid Spotify *Url*_");
  const meta = await spotifyMetaData(link);
  let txt = `*_${meta.title}_*\n*_${meta.description}_*\n\n\n\`\`\`1.⬢\`\`\` *audio*\n\`\`\`2.⬢\`\`\` *video*\n\n_*Send a number as a reply to download*_`;
  await message.reply({
    url: meta.thumbnail 
  }, 'image', { 
    caption: txt
  });
});
