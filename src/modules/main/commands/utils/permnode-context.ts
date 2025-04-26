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
          type: Constants.ApplicationCommandOptionTypes.USER,
          name: "entity",
          value: member.id
        }
      ],
      getSubCommand: () => "view"
    };

    const mockInteraction = Object.assign({}, interaction, {
      data: {
        ...interactionData,
        resolved: {
          users: {
            [member.id]: {
              id: member.user.id,
              username: member.user.username,
              discriminator: member.user.discriminator,
              avatar: member.user.avatar,
              bot: member.user.bot ?? false,
              system: member.user.system ?? false,
              publicFlags: member.user.publicFlags ?? 0,
            },
          },
          members: {
            [member.id]: {
              id: member.id,
              roles: member.roles,
              nick: member.nick,
              avatar: member.avatar,
              joinedAt: member.joinedAt,
              premiumSince: member.premiumSince,
              communicationDisabledUntil: member.communicationDisabledUntil,
            },
          },
        },
        targetID: member.id,
        options: {
          getSubCommand: () => "view",
          raw: interactionData.options,
        },
      },
    });
    
    await new Permnode(this.bot).execute(mockInteraction as CommandInteraction);
    return;
  }
}