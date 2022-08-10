import { CommandInteraction, Constants, Guild, InteractionDataOptionsSubCommand, Member, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { moduleData } from "../../main";

export default class Log extends Command {

    constructor(bot: Bot) {

        super(bot);

        this.commands = ["starboard"];
        this.description = "View Starboard Data for a user"
        this.example = "starboard view @user"
        this.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "view",
                description: "View Starboard Data for a user",
                permissions: ["starboard.view"],
                options: [
                    {
                        type: Constants.ApplicationCommandOptionTypes.USER,
                        name: "user",
                        description: "The user to view Starboard Data for",
                        required: true
                    }
                ]
            }
        ]

    }

    readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {

        const guild = this.bot.findGuild(interaction.guildID) as Guild,
            data = (await this.bot.getModuleData("Main", guild)) as moduleData,
            subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommand;

        switch (subcommand.name) {

            case "view": {
                await interaction.defer();

                const member = this.bot.findMember(guild, subcommand.options?.[0].value!! as string) as Member,
                    stars = data.messages.filter((m) => m.authorID === member.id).length;

                await interaction.createMessage({
                    embeds: [
                        {
                            title: `User has ⭐ **${stars}** stars.`
                        }
                    ],
                    flags: Constants.MessageFlags.EPHEMERAL
                })
            }
        }
    }
}