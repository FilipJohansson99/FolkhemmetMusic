"use strict";
import { Context } from "./Context";
import { Constants, Message, PossiblyUncachedTextableChannel } from "eris";
import { BaseDiscordClient } from "../BaseDiscordClient";

export class CommandManager {
    client: BaseDiscordClient;
    constructor(client: BaseDiscordClient) {
        this.client = client;
    }
    async resolvePartials(message: any) {
        let channel, guild, member, me;
        channel = message.channel && message.channel.name ? message.channel : this.client.getChannel(message.channel.id) || await this.client.getRESTChannel(message.channel.id);
        member = message.member && message.member.username ? message.member : channel.guild && channel.guild.name ? channel.guild.members.get(message.author.id) ? channel.guild.members.get(message.author.id) : await this.client.getRESTGuildMember(message.guildID, message.author.id) : await this.client.getRESTGuildMember(message.guildID, message.author.id);
        guild = channel.guild.name ? channel.guild : member.guild.name ? member.guild : await this.client.getRESTGuild(message.guildID);
        this.client.guilds.set(guild.id, guild)
        me = guild.members.get(this.client.user.id);
        if (!me || !me.username) {
            me = await this.client.getRESTGuildMember(message.guildID, this.client.user.id);
            guild.members.set(this.client.user.id, me)
        }
        message.channel = channel;
        message.channel.guild = guild;
        message.member = member;
        if (!guild.members.get(member.id)) guild.members.set(member.id, member)
        return { channel, guild, member, me }
    }
    async handle(message: Message<PossiblyUncachedTextableChannel>) {
        if (!message.guildID || message.author.bot) return;
        if (this.client.collectors.handle(message, "message")) return
        if (message.content.match(new RegExp(`^<@!?${this.client.user.id}>( |)$`)))
            return this.client.createMessage(message.channel.id, {
                embeds: [
                    {
                        color: 0x3A871F,
                        author: { name: "Green-bot | Get started", icon_url: this.client.user.dynamicAvatarURL(), url: "https://green-bot.app/" },
                        description:
                            "Hello! My prefix is set to `*` for this server, to get all the commands use the </help:1006139552248897561> command!\n\nTo play a music with me, just join a voice channel and use the </play:1006139552248897562> command",
                    },
                ],
                components: [
                    {
                        components: [
                            { url: "https://green-bot.app/commands", label: "Commands", style: 5, type: 2 },
                            { url: "https://green-bot.app/premium", label: "Premium", style: 5, type: 2 },
                            { url: "https://green-bot.app/invite", label: "Invite", style: 5, type: 2 },
                        ],
                        type: 1,
                    },
                ],
            });
        let cleanedContent = message.content.toLowerCase();
        if (cleanedContent.startsWith("*") || cleanedContent.startsWith("<@!" + this.client.user.id + ">") || cleanedContent.startsWith("<@" + this.client.user.id + ">") || cleanedContent.startsWith("green")) {
            let args;
            cleanedContent.startsWith("*") && (args = message.content.slice(1).trim().split(/ +/))
            cleanedContent.startsWith("<@!" + this.client.user.id + ">") && (args = message.content.slice(22).trim().split(/ +/))
            cleanedContent.startsWith("<@" + this.client.user.id + ">") && (args = message.content.slice(21).trim().split(/ +/))
            cleanedContent.startsWith("green") && (args = message.content.slice(5).trim().split(/ +/));
            const command = this.client.commands.getCommand(args.shift().toLowerCase())
            if (!command) return this.client.config.debug && console.log(`[Message not handled ()] Content ${message.content} has been ignored. Potential aliase?`);
            const { channel, guild, member, me } = await this.resolvePartials(message)
            this.client.database.resolve(message.guildID).then(async data => {
                let context = new Context(this.client, message, args, data, me, member);
                if (!this.client.hasBotPerm(context, "sendMessages")) {
                    message.author.getDMChannel().then(dmChannel => {
                        dmChannel.createMessage(
                            "Hello! I tried to send a reply to your command, however, I lack the permission to \u{1F615}. Please have someone from the staff give me the `Send Messages` Discord permission.\n\n Server: **" +
                            guild.name +
                            "**\n Command: **" +
                            command.name +
                            "**\n Want help with permissions? Join the support server: https://discord.gg/greenbot")
                    })
                    return
                }
                if (!this.client.hasBotPerm(context, "embedLinks")) {
                    return this.client.createMessage(channel.id, "\u274C The bot must have the `Embed links` Discord permission to work properly! \n Please have someone from the staff give me this permission.")
                }

                if (data.txts && data.txts.length && !data.txts.includes(`${channel.id}`) && "textchannels" !== command.name) {
                    return context.errorMessage(`I am not allowed to answer to commands in this channel.
                ${data.txts.length > 1 ? `Please use one of the following channels: ${data.txts.map((a) => `<#${a}>`).join(",")}` : `Please use the <#${data.txts[0]}> channel`}`)
                }
                let eligigle = this.client.shoukaku.checkEligible(context)
                if (!eligigle && !(await this.client.database.checkPremium(message.guildID, message.author.id, true))) {
                    return context.errorMessage("**Oops!** You need to wait 2 seconds before each command! \n\n Want to bypass this? Become a [Premium](https://green-bot.app/premium) user or switch to [slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)!")
                }
                if (this.client.config.premiumCmd.includes(command.name) && !(await this.client.database.checkPremium(message.guildID, message.author.id, true))) {
                    return this.client.createMessage(message.channel.id, {
                        embeds: [
                            {
                                color: 0x3A871F,
                                author: { name: "Premium command", icon_url: this.client.user.dynamicAvatarURL(), url: "https://green-bot.app/premium" },
                                description:
                                    "This command is locked behind premium because it uses more CPU than the other commands.\n\nYou can purchase the premium on the [Patreon Page](https://green-bot.app/premium) to use this command..",
                            },
                        ],
                        components: [{ components: [{ url: "https://green-bot.app/premium", label: "Premium", style: 5, type: 2 }], type: 1 }],
                    })
                }

                if (this.client.config.voteLocks.includes(command.name) && !(await this.client.database.checkPremium(message.guildID, message.author.id, true)) && !(await this.checkVoted(message.author.id))) {
                    return this.client.createMessage(message.channel.id, {
                        embeds: [
                            {
                                footer: { text: "You can bypass this restriction by purchasing our premium (green-bot.app/premium)" },
                                color: 0xC73829,
                                description: "You need to vote the bot [here](ttps://green-bot.app/vote) to access this command.\nClick here to vote: [**green-bot.app/vote**](https://top.gg/bot/783708073390112830/vote)",
                            },
                        ],
                        components: [
                            {
                                components: [
                                    { url: "https://green-bot.app/vote", label: "Vote", style: 5, type: 2 },
                                    { url: "https://green-bot.app/premium", label: "Premium", style: 5, type: 2 },
                                ],
                                type: 1,
                            },
                        ],
                    })
                }

                if (command.permissions && !channel.permissionsOf(member).has(command.permissions)) {
                    return context.errorMessage(`You need to have the \`${command.permissions[0].replace("manageGuild", "Manage Server")}\` permission to use this command`)
                }

                if (command.arguments && command.arguments[0].required && !args[0]) {
                    return context.errorMessage(`You need to provide arguments for this command. (${command.arguments[0].description})\n\n Example usage: \`*${command.name} ${command.arguments[0].name}\``)
                }
                if (data.dj_commands.length && data.dj_commands.includes(command.name) && !this.checkDJ(context)) {
                    return context.errorMessage("You need to have the `Manage Messages` permission or a DJ role to use this command!")
                }

                const checks = command.checks;
                if (checks) {
                    if (checks.voice === true && !member.voiceState.channelID) return context.errorMessage(`You have to be connected in a voice channel on this server to  use this command!\n\nHow to join a voice channel? Just click on a channel with a speaker icon ( for example click here:  ${me.voiceState && me.voiceState.channelID ? `<#${me.voiceState.channelID}>` : `<#${guild.channels.filter(c => c.type == 2)[0]?.id}`}> ) [See official discord guide](https://support.discord.com/hc/en-us/articles/360045138571-Beginner-s-Guide-to-Discord#h_9de92bc2-3bca-459f-8efd-e1e2739ca4f4)`)
                    if (checks.channel === true && member.voiceState.channelID && me.voiceState.channelID && member.voiceState.channelID !== me.voiceState.channelID) {
                        return context.errorMessage(
                            "You need to be in the same voice channel as me (<#" +
                            me.voiceState.channelID +
                            ">)! Want to listen music with another Green-bot? Consider inviting [Green-bot 2](https://discord.com/oauth2/authorize?client_id=902201674263851049&scope=applications.commands&permissions=3165184)!"
                        )
                    }
                    if (checks.dispatcher) {
                        if (!context.dispatcher || context.dispatcher && !context.dispatcher.playing) return context.errorMessage("I am not currently playing music in this server. So it's impossible to do that")
                    }
                }

                try {
                    command.run({ ctx: context })
                } catch (error) {
                    console.log(error)
                    console.log(`[Command Service] Error when executing command ${command.name}`)
                    context.errorMessage(`**Uh Oh!** Something went wrong  while executing your command..\nCheck the bot permissions or go in the [support server](https://discord.gg/greenbot) and report this issue: \`${error}\``)
                }
            })
        }

    }
    async checkVoted(userId: string) {
        let voted = false;;
        try {
            voted = await this.client.dbl.hasVoted(userId);
        } catch (err) {
            voted = true;
            this.client.config.debug && console.log(`[CommandServer] Top.gg request for ${userId} failed with error: ${err}, bypassing...`)
        }
        return voted;
    }
    checkDJ(context: Context) {
        let isDj = false;
        if (!context.guildDB.djroles || !context.guildDB.djroles.length) return true
        if (context.guildDB.djroles && context.guildDB.djroles.length && context.member.roles.find(r => context.guildDB.djroles.includes(r))) isDj = true;
        if (context.member.permissions.has("manageMessages")) isDj = true;
        if (context.dispatcher && context.dispatcher.metadata.dj === context.member.id) isDj = true;
        return isDj;
    }
}
