const BaseCommand = require("../../abstract/BaseCommand.js");
class Play extends BaseCommand {get name() { return "search" }
    get description() { return "Searchs a track for you!" }get arguments() { return [{ name: "query", type: 3, description: "The track you want to search", required: !0 }] }
    get category() { return "Everyone Commands" }get playerCheck() { return { voice: !0, dispatcher: !1, channel: !1 } }
    async run({ ctx: e }) { let n = e.args[0].value; if (!e.dispatcher || !e.dispatcher.player.connection) { if (!e.member.voice.channel.joinable || !e.member.voice.channel.viewable) return e.errorMessage("I don't have the required permissions to join your voice channel! I need `View Channels`, `Connect` and `Speak` permissions. [Permissions Example](https://cdn.discordapp.com/attachments/904438715974287440/909076558558412810/unknown.png)\n If the problem persists, change the voice channel region to `Europe`"); if (!e.member.voice.channel.speakable && "GUILD_STAGE_VOICE" !== e.member.voice.channel.type) return e.errorMessage("I don't have the permission to speak in your voice channel.\n Please give me the permission to or check this guide to learn how to give me this permissions:\nhttps://guide.green-bot.app/frequent-issues/permissions"); if (e.guildDB.vcs.length && !e.guildDB.vcs.includes(e.member.voice.channelId)) return e.errorMessage(e.guildDB.vcs.length > 1 ? `I am not allowed to play music in your voice channel.\n Please join one of the following channels: ${e.guildDB.vcs.map(e=>`<#${e}>`).join(",")}`:`I can only play music in the <#${e.guildDB.vcs[0]}> channel.`)}const t=e.client.shoukaku.getNode(),o=e.dispatcher?e.dispatcher:await e.client.queue.create(e,t);3==o.player.connection.state&&e.dispatcher.player.connection.reconnect().then(()=>e.dispatcher.player.resume()),t.rest.resolve(n,"youtube").then(t=>{if(!t.tracks.length||0==t.tracks.length)return e.errorMessage("I didn't find any song on the query you provided!");let r=t.tracks.map((e,n)=>`**${n+1}**. [${e.info.title.slice(0,100)}](${e.info.uri})`).slice(0,7).join("\n");e.reply({embeds:[{color:"#3A871F",description:`• **${t.tracks.length}** results found for \`${n}\`\n• Send the number of the song that you want to play in this channel. Ex: 1`,fields:[{name:"Songs list",value:r}],author:{name:"Green-bot | Search",icon_url:e.author.displayAvatarURL({dynamic:!0,size:512})},footer:{text:"Green-bot | Free music for everyone!",icon_url:e.client.user.displayAvatarURL({dynamic:!0,size:512})}}]}).then(async n=>{const r=e.channel.createMessageCollector({filter:n=>n.author.id===e.author.id,time:6e4});r.on("collect",async a=>"cancel"===a.content.toLowerCase()?(r.stop(),a.delete().catch(e=>{}),e.errorMessage("Canceled")):isNaN(a.content)?e.errorMessage("You must send a valid track number").then(e=>setTimeout(()=>e.delete().catch(e=>{}),4e3)):t.tracks[a.content-1]?(a.delete().catch(e=>{}),r.stop(),n.delete(),o.playing?e.reply({embeds:[{description:`Enqueued **[${t.tracks[a.content-1].info.title.slice(0,100)}](${t.tracks[a.content-1].info.uri})** at position **${o.queue.length}**`,color:"#3a871f"}]}):e.successMessage("Successfuly created the played and joined your channel!\n\nDid you know? You can now manage the music on the [Dashboard](https://dash.green-bot.app/app/"+e.guild.id+")"),void o.addTrack(t.tracks[a.content-1],e.author)):e.errorMessage("You must send a valid track number").then(e=>setTimeout(()=>e.delete().catch(e=>{}),4e3)))})})}}module.exports=Play;