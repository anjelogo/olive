import { CommandInteraction, Constants } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class Avatar extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["avatar"];
    this.description = "Get the avatar of a user";
    this.example = "avatar @anjelo";
    this.permissions = ["main.avatar"];
    this.options = [
      {
        name: "user",
        description: "The user to warn",
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
      }
    ];
    this.tags = ["information"];
  
  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    
    return interaction.createFollowup({
      components:[
        {type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${interaction.data.options.getUser("user", true).username}'s Avatar`,
            }, {
              type: Constants.ComponentTypes.MEDIA_GALLERY,
              items: [
                {
                  description: `${interaction.data.options.getUser("user", true).username}'s Avatar`,
                  media: {
                    url: interaction.data.options.getUser("user", true).avatarURL() || interaction.data.options.getUser("user", true).defaultAvatarURL(),
                  }
                }
              ]
            }
          ]}
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2
    });
  };

}