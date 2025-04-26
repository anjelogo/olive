import { CommandInteraction, Constants, Member } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import Permnode from "./permnode";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class PermnodeContext extends Command {
    
  constructor(bot: ExtendedClient) {
    super(bot);

    this.commands = ["View User's Permission nodes"];
    this.permissions = ["main.permnode.view"];
    this.example = null;
    this.type = Constants.ApplicationCommandTypes.USER;
  }

  public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

    const member = interaction.data.resolved.members.find((m: Member) => m.id === interaction.data.targetID);

    if (!member) return await interaction.createFollowup({content: "Member not found"});
    
    const interactionData = {
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      name: "view",
      options: [
        {
          type: Constants.ApplicationCommandOptionTypes.STRING,
          name: "entity",
          value: member.id
        }
      ],
      getSubCommand: () => "view"
    };

    const mockInteraction = Object.assign({}, interaction, {
      data: {
        ...interactionData,
        options: {
          getSubCommand: () => "view", // Mimic the expected method
          raw: interactionData.options // Provide raw options if needed
        }
      }
    });
    await new Permnode(this.bot).execute(mockInteraction as CommandInteraction);
    return;
  }
}