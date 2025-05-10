import { Constants, Guild, MessageComponent, TextChannel } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import Module from "../../Base/Module";
import { LogChannelTypes, LoggingModuleData } from "../../Database/interfaces/LoggingModuleData";

export default class Logging extends Module {

  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly weight: number;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.name = "Logging";
    this.version = "1.1";
    this.path = "modules/logging";
    this.weight = 1;
    this.db = true;

  }

  public run = async (): Promise<void> => {
    await this.load();
  }

  readonly moduleData = {
    guildID: "",
    channels: []
  }

  readonly log = async (guild: Guild, type: LogChannelTypes, components: MessageComponent[], data?: { channelID?: string, caseID?: string, starID?: string }) => {
    const guildData = await this.bot.getModuleData("Logging", guild.id) as LoggingModuleData;

    if (!guildData) return;
    if (guildData.channels) {
      const channels = guildData.channels.filter((c) => c.types.includes(type));

      for (const c of channels) {
        const channel = this.bot.findChannel(guild, c.channelID) as TextChannel,
          message = await channel.createMessage({
            components,
            flags: Constants.MessageFlags.IS_COMPONENTS_V2
          });

        if (type === "moderation") {
          c.cases ? c.cases.push({
            channelID: channel.id,
            messageID: message.id,
            caseID: data?.caseID as string
          }) : c.cases = [{
            channelID: channel.id,
            messageID: message.id,
            caseID: data?.caseID as string
          }];

          await this.bot.updateModuleData(this.name, guildData, guild);
        }

        if (type === "starboard") {
          c.stars ? c.stars.push({
            channelID: data?.channelID as string,
            messageID: message.id,
            starID: data?.starID as string
          }) : c.stars = [{
            channelID: data?.channelID as string,
            messageID: message.id,
            starID: data?.starID as string
          }];

          await message.createReaction("⭐");
          await this.bot.updateModuleData(this.name, guildData, guild);
        }

      }
    }
  }
}