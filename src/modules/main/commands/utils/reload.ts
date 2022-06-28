import { CommandInteraction, ComponentInteraction, Message } from "eris";
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

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
        await interaction.defer();

		return interaction.createMessage({
			embeds: [
				{
					color: 1416145,
					description: "Are you sure you want to reload the bot's application commands?",
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
                            custom_id: `reload_${interaction.member?.id}_yes`
                        }, {
                            type: 2,
                            style: 4,
                            label: "No",
                            custom_id: `reload_${interaction.member?.id}_no`
                        }
                    ]
                }
            ]
		});
	}

    readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

        switch (component.data.custom_id.split("_")[0]) {
        
        case "yes": {
            component.defer();

            await this.bot.reload();
            
            return component.editParent({
                embeds: [
                    {
                        color: 1416145,
                        description: "Successfully reloaded the bot's application commands.",
                    }
                ],
                components: []
            })
        }

        case "no": {
            return component.editParent({
                embeds: [
                    {
                        color: 1416145,
                        description: "Cancelled request to reload bot's application commands.",
                    }
                ],
                components: []
            })
        }
        
        }

    }

}