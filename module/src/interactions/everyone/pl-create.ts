import { Command } from "../../abstract/QuickCommand";
export default class Queue extends Command {
    get name() {
        return "pl-create";
    }
    get description() {
        return "Creates a playlist";
    }
    get aliases() {
        return ["pl", "playlist"];
    }
    get category() {
        return "Everyone Commands";
    }
    get arguments() {
        return [
            { name: "playlist_name", description: "The name of the playlist you want to create", required: true, type: 3 },
        ];
    }
    async run({ ctx: e }) {
        const a = e.args[0].value;
        if (a.length < 3 || a.length > 50) return e.errorMessage("The playlist name must be beetween 2 and 50 long.");
        const s = await e.client.database.getUser(e.author.id);
        return (s && s.playlists.find((e) => e.name === a)) || "all" === a
            ? e.errorMessage("You already have a playlist with this name or you can't use this name.")
            : s && s.playlists.length >= 5 && !(await e.client.database.checkPremium(e.guild.id, e.author.id, true))
            ? e.errorMessage("You have reached the maximum number of playlists!\n Please upgrade to the [Premium](https://green-bot.app/premium) to create more playlists!")
            : void setTimeout(
                  async () => (
                      s.playlists.push({ name: a, tracks: [] }), e.client.database.updateUser(s),
                      e.successMessage(
                          `Created a playlist with the name **${a}** ${`\n\n__How it works?__\n\n• You can add tracks to this playlist using the ${e.client.printCmd("pl-add")} command!\n• You can play your playlist using the ${e.client.printCmd("pl-play")} command.`}`
                      )
                  ),
                  500
              );
    }
}
