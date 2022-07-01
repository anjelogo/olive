import { CommandInteraction, Constants, Guild, InteractionDataOptions, InteractionDataOptionsSubCommand, InteractionDataOptionsUser, Member, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { getCases, removeCase } from "../../internals/caseHandler";

export default class History extends Command {

    constructor(bot: Bot) {

        super(bot);

        this.commands = ["history"];
        this.example = "history view @user";
        this.description = "Views the moderation history of a user";
        this.permissions = ["moderation.history.view", "moderation.history.*"];
        this.options = [
            {
                name: "view",
                description: "View the moderation history of a user",
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "user",
                        description: "The user to view the moderation history of",
                        required: true,
                        type: Constants.ApplicationCommandOptionTypes.USER,
                    }
                ]
            }, {
                name: "clear",
                description: "Clear the moderation history of a user",
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [
                    {
                        name: "user",
                        description: "The user to clear the moderation history of",
                        required: true,
                        type: Constants.ApplicationCommandOptionTypes.USER,
                    }
                ]
            }
        ]

    }

    readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
        await interaction.defer(Constants.MessageFlags.EPHEMERAL);
        
        const guild = this.bot.findGuild(interaction.guildID!!) as Guild,
            subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommand;

        switch (subcommand.name) {
            case "view": {
                const suboption = subcommand.options?.[0] as InteractionDataOptionsUser,
                    suboptionvalue = suboption.value as string,
                    user = this.bot.findMember(guild, suboptionvalue) as Member,
                    cases = await getCases(this.bot, guild, user.id);

                if (!cases)
                    return interaction.createMessage({
                        content: `${this.bot.constants.emojis.x} I couldn't find any cases for that user!`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });

                let infractions = 0,
                    hierarchy = {
                        warn: 1,
                        timeout: 2,
                        kick: 2,
                        ban: 3
                    },
                    arr = [];

                for (const Case of cases) {
                    if (!Case.resolved) infractions += hierarchy[Case.action]
                    
                    let string = `\`Case (${Case.id}) [${Case.action.substring(0, 1).toUpperCase()}]\``;
                    Case.resolved ? string = `~~${string}~~` : string;
                    arr.push(string);
                };

                const embed = {
                    title: `History for ${user.username}#${user.discriminator}`,
                    description: "`[W]` - Warn\n`[K]` - Kick\n`[T]` - Timeout\n`[B]` - Ban",
                    fields: [
                        {
                            name: `Cases (${arr.length})`,
                            value: arr.length ? arr.join(", ") : "None"
                        }
                    ],
                    color: this.bot.constants.config.colors.default,
                    footer: {
                        text: `Infractions: ${infractions}`,
                    }, 
                    timestamp: new Date().toISOString()
                }

                return interaction.createMessage({
                    content: undefined,
                    embeds: [embed],
                    flags: Constants.MessageFlags.EPHEMERAL
                })
            }

            case "clear": {
                const suboption = subcommand.options?.[0] as InteractionDataOptionsUser,
                    suboptionvalue = suboption.value as string,
                    user = this.bot.findMember(guild, suboptionvalue) as Member,
                    cases = await getCases(this.bot, guild, user.id);

                if (!cases)
                    return interaction.createMessage({
                        content: `${this.bot.constants.emojis.x} I couldn't find any cases for that user!`,
                    });

                for (const Case of cases) {
                    await removeCase(this.bot, guild, Case.id);
                };


                return interaction.createMessage({
                    content: `${this.bot.constants.emojis.check} Successfully cleared the moderation history of ${user.mention}`,
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }
        }

    }

}