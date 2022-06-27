import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import ComponentManager from "../../../../Base/Application/ComponentManger";
import FollowupManager from "../../../../Base/Application/FollowupManager";
import { ApplicationCommandOption } from "../../../../Base/Application/types";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";

export default class Reload extends Command {
	
	constructor(bot: Bot) {

		super(bot);

		this.disabled = true;
		this.commands = ["reload"];
		this.description = "Reload application commands";
		this.example = "eval";
		this.devOnly = true;
		this.guildSpecific = ["793439337063645184"]; //Olive Support
	
	}

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager> => {

		const code = ((interaction.getOption("expression") as unknown as ApplicationCommandOption).value as string);

		return interaction.reply({
			embeds: [
				{
					color: 1416145,
					description: "Are you sure you want to reload the bot's application commands?",
					type: "rich"
				}
			],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 3,
                            label: "Yes",
                            custom_id: "reload_yes"
                        }, {
                            type: 2,
                            style: 4,
                            label: "No",
                            custom_id: "reload_no"
                        }
                    ]
                }
            ]
		});
	}

    readonly update = async (component: ComponentManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {

        const interaction = component.root;

        switch (component.name) {
        
        case "reload_yes": {
            interaction.defer();

            await this.bot.reload();
            
            return interaction.edit({
                embeds: [
                    {
                        color: 1416145,
                        description: "Successfully reloaded the bot's application commands.",
                        type: "rich"
                    }
                ],
                components: []
            })
        }

        case "reload_no": {
            return interaction.edit({
                embeds: [
                    {
                        color: 1416145,
                        description: "Cancelled request to reload bot's application commands.",
                        type: "rich"
                    }
                ],
                components: []
            })
        }
        
        }

    }

}