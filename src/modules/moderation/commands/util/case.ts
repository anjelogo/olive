import { CommandInteraction, Constants, Guild, InteractionDataOptionsString, InteractionDataOptionsSubCommand, Member, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { moduleData, Case as CaseStructure} from "../../main";
import { moduleData as LoggingModuleData } from "../../../logging/main";
import { removeCase, resolveCase } from "../../internals/caseHandler";

export default class Case extends Command {

    constructor (bot: Bot) {

        super(bot);

        this.commands = ["case"];
        this.description = "Interact with the moderation cases of a user";
        this.example = "case get 123";
        this.permissions = ["moderation.case.*"];
        this.options = [
            {
                name: "view",
                description: "View the moderation case of a user",
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                permissions: ["moderation.case.view"],
                options: [
                    {
                        name: "case",
                        description: "The case ID of the case to view",
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    }
                ]
            }, {
                name: "resolve",
                description: "Resolve a moderation case",
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                permissions: ["moderation.case.resolve"],
                options: [
                    {
                        name: "case",
                        description: "The case ID of the case to resolve",
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    }, {
                        name: "reason",
                        description: "The reason for resolving the case",
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                    }
                ]
            }, {
                name: "delete",
                description: "Delete a moderation case",
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                permissions: ["moderation.case.delete"],
                options: [
                    {
                        name: "case",
                        description: "The case ID of the case to delete",
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                        required: true
                    }
                ]
            }
        ]

    }

    readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
        await interaction.defer(Constants.MessageFlags.EPHEMERAL);
        
        const member = interaction.member as Member,
            guild = this.bot.findGuild(interaction.guildID!!) as Guild,
            data = await this.bot.getModuleData("Moderation", guild) as moduleData,
            subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommand;

        switch (subcommand.name) {

        case "view": {
            const caseID = subcommand.options?.[0]!!.value as string,
                Case = data.cases.find((c) => c.id === caseID);

            if (!Case)
                return interaction.createMessage({
                    content: `${this.bot.constants.emojis.x} I could not find that case.`,
                    flags: Constants.MessageFlags.EPHEMERAL
                });

            const guildData = await this.bot.getModuleData("Logging", guild) as LoggingModuleData;

            if (guildData.channels.filter((c) => c.types.includes("moderation")).length) {
                 const moderationLogChannels = guildData.channels.filter((c) => c.types.includes("moderation") && c.cases);

                if (!moderationLogChannels.length) return;

                 const channelsWithCases = moderationLogChannels.filter((c) => c.cases!!.find((c) => c.caseID === Case.id));

                if (!channelsWithCases) return;

                const logCase = channelsWithCases.map((c) => c.cases!!.find((c) => c.caseID === Case.id))[0];

                if (!logCase)
                    return interaction.createMessage({
                        content: `${this.bot.constants.emojis.x} I could not find that case.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });

                const logMessage = await this.bot.getMessage(logCase.channelID, logCase.messageID);

                if (!logMessage)
                    return interaction.createMessage({
                        content: `${this.bot.constants.emojis.x} I could not find that case.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });

                return interaction.createMessage({
                    embeds: [logMessage.embeds!![0]],
                    flags: Constants.MessageFlags.EPHEMERAL
                });

            }

            break;
        }

        case "resolve": {
            const caseID = subcommand.options?.[0]!!.value as string,
                Case = data.cases.find((c) => c.id === caseID),
                suboption = subcommand.options?.[1] as InteractionDataOptionsString,
                suboptionvalue = suboption?.value;

            if (!Case)
                return interaction.createMessage({
                    content: `${this.bot.constants.emojis.x} I could not find that case.`,
                    flags: Constants.MessageFlags.EPHEMERAL
                });

            if (Case.resolved)
                return interaction.createMessage({
                    content: `${this.bot.constants.emojis.x} That case has already been resolved.`,
                    flags: Constants.MessageFlags.EPHEMERAL
                });

            let reason = suboption ? suboptionvalue : "No reason provided";

            await resolveCase(this.bot, guild, Case.id, member.id, reason);
            
            return interaction.createMessage({
                content: `${this.bot.constants.emojis.check} Case \`${Case.id}\` has been resolved.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
        }

        case "delete": {
            const caseID = subcommand.options?.[0]!!.value as string,
                Case = data.cases.find((c) => c.id === caseID);

            if (!Case)
                return interaction.createMessage({
                    content: `${this.bot.constants.emojis.x} I could not find that case.`,
                    flags: Constants.MessageFlags.EPHEMERAL
                });

            await removeCase(this.bot, guild, Case.id);

            return interaction.createMessage({
                content: `${this.bot.constants.emojis.check} Case \`${Case.id}\` has been deleted.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
        }

        }

    }

}