import { CommandInteraction, Constants, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import Starboard from "./starboard";

export default class StarboardContext extends Command {
    
    constructor(bot: Bot) {
        super(bot);

        this.commands = ["View Stars"];
        this.permissions = ["starboard.view"];
        this.example = null;
        this.type = Constants.ApplicationCommandTypes.USER;
    }

    public execute = async (interaction: CommandInteraction): Promise<Message | undefined | void> => {

        const member = interaction.data.resolved?.members?.map(u => u)[0]!!;

        (interaction as any).data.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                name: "view",
                options: [
                    {
                        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                        name: "user",
                        options: [
                            {
                                type: Constants.ApplicationCommandOptionTypes.STRING,
                                name: "user",
                                value: member.id
                            }
                        ]
                    }
                ]
            }
        ]

        return await new Starboard(this.bot).execute(interaction as unknown as CommandInteraction);
    }
}