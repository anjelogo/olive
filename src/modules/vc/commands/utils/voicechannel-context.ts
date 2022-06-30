import { CommandInteraction, Constants, Interaction, Message, User } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import Voicechannel from "./voicechannel";

export default class VoicechannelContext extends Command {
    
    constructor(bot: Bot) {
        super(bot);

        this.commands = ["Set Voice Channel Owner"];
        this.permissions = ["vc.edit.owner"];
        this.example = null;
        this.type = Constants.ApplicationCommandTypes.USER;
    }

    public execute = async (interaction: CommandInteraction): Promise<Message | undefined | void> => {

        const member = interaction.data.resolved?.members?.map(u => u)[0]!!;

        (interaction as any).data.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                name: "set",
                options: [
                    {
                        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        name: "owner",
                        options: [
                            {
                                type: Constants.ApplicationCommandOptionTypes.STRING,
                                name: "name",
                                value: member.id
                            }
                        ]
                    }
                ]
            }
        ]

        return await new Voicechannel(this.bot).execute(interaction as unknown as CommandInteraction);
    }
}