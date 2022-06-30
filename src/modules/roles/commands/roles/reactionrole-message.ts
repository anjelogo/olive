import { CommandInteraction, Constants, Interaction, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { findAndUpdateCustomData } from "../../../main/internals/CustomDataHandler";
import Reactionrole from "./reactionrole";

export default class ReactionroleMessage extends Command {
    
    constructor(bot: Bot) {
        super(bot);

        this.commands = ["Create/Edit Reaction Role"];
        this.permissions = ["roles.reaction.modify"]
        this.example = null;
        this.type = Constants.ApplicationCommandTypes.MESSAGE;
    }

    public execute = async (interaction: CommandInteraction): Promise<Message | undefined | void> => {

        const message: any = interaction.data.resolved?.messages?.map(m => m)[0]!!;

        (interaction as any).data.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "modify",
                options: [
                    {
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                        name: "messageid",
                        value: message.id
                    }
                ]
            }
        ]

        return await new Reactionrole(this.bot).execute(interaction as unknown as CommandInteraction);
    }
}