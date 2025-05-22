import { FollowupMessageInteractionResponse, InitialMessagedInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import { Constants, ApplicationCommandTypes, CommandInteraction, ComponentInteraction, Message, ApplicationCommandOptions, ModalSubmitInteraction, InteractionCallbackResponse, AnyInteractionChannel, Uncached } from "oceanic.js";
import { Constants as CustomConstants } from "../resources/interfaces";
import ExtendedClient from "./Client";

export type Options =  ApplicationCommandOptions & {
  permissions?: string[];
  requirePerms?: string[];
  options?: Options[];
}

export default class Command {

  public type: (ApplicationCommandTypes | undefined);
  public disabled = false;
  public commands: string[];
  public description: string;
  public example: (string | null);
  public enabled: boolean;
  public devOnly: boolean;
  public category: string;
  public noDefer: boolean;
  public permissions?: string[];
  public requirePerms?: keyof typeof Constants.Permissions;
  public options?: Options[];
  public bot: ExtendedClient;
  public constants: CustomConstants;
  public guildSpecific?: string[];
  public execute: (interaction: CommandInteraction) => Promise<InitialMessagedInteractionResponse<CommandInteraction | ComponentInteraction> | FollowupMessageInteractionResponse<CommandInteraction | ComponentInteraction> | InteractionCallbackResponse<AnyInteractionChannel | Uncached> | undefined | void> | undefined;
  public update: (component: ComponentInteraction) => Promise<FollowupMessageInteractionResponse<CommandInteraction | ComponentInteraction> | Message | undefined | void> | undefined;
  public modalSubmit: (modal: ModalSubmitInteraction) => Promise<FollowupMessageInteractionResponse<CommandInteraction | ComponentInteraction> | Message | undefined | void> | undefined;

  constructor(bot: ExtendedClient) {
    this.commands = [];
    this.description = "No Description Available :(";
    this.example = "No Example Available :(";
    this.enabled = true;
    this.devOnly = false;
    this.bot = bot;
    this.constants = bot.constants;
    this.category = "Uncategorized";
    this.noDefer = false;

    this.execute = () => { return undefined; };
    this.update = () => { return undefined; };
    this.modalSubmit = () => { return undefined; };
  }

}