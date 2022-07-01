import { CommandInteraction, Constants, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import History from "./history";

export default class HistoryContext extends Command {
    
    constructor(bot: Bot) {
        super(bot);

        this.commands = ["View History"];
        this.permissions = ["moderation.history.view", "moderation.history.*"];
        this.example = null;
        this.type = Constants.ApplicationCommandTypes.USER;
    }

    public execute = async (interaction: CommandInteraction): Promise<Message | undefined | void> => {

        const member = interaction.data.resolved?.members?.map(u => u)[0]!!;

        (interaction as any).data.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "view",
                options: [
                    {
                        type: Constants.ApplicationCommandOptionTypes.USER,
                        name: "user",
                        value: member.id
                    }
                ]
            }
        ]

        return await new History(this.bot).execute(interaction as unknown as CommandInteraction);
    }
}