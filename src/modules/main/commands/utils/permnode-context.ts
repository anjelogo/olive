import { CommandInteraction, Constants, Message } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import Permnode from "./permnode";

export default class PermnodeContext extends Command {
    
    constructor(bot: Bot) {
        super(bot);

        this.commands = ["View User's Permission nodes"];
        this.permissions = ["main.permnode.view"]
        this.example = null;
        this.type = Constants.ApplicationCommandTypes.USER;
    }

    public execute = async (interaction: CommandInteraction): Promise<Message | undefined | void> => {

        const member: any = interaction.data.resolved?.members?.map(m => m)[0]!!;

        (interaction as any).data.options = [
            {
                type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "view",
                options: [
                    {
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                        name: "entity",
                        value: member.id
                    }
                ]
            }
        ]

        return await new Permnode(this.bot).execute(interaction as unknown as CommandInteraction);
    }
}