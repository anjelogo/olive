import Module, { moduleDataStructure } from "../../Base/Module";
import ExtendedClient from "../../Base/Client";

export type CaseActionTypes = ("ban" | "kick" | "timeout" | "warn");

export interface Case {
    id: string;
    userID: string;
    moderatorID: string;
    reason?: string;
    action: CaseActionTypes;
    timestamp: string; //ISO timestamp
    time?: string;
    resolved?: {
        moderatorID: string;
        reason: string;
    };
}

export interface ModerationSettings {
    caseLimit: number;
    infractionUntilBan: number;
    infractionUntilKick: number;
    infractionUntilTimeout: number;
}

export interface moduleData extends moduleDataStructure {
    cases: Case[];
    settings: ModerationSettings
}

export default class Moderation extends Module {

  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.name = "Moderation";
    this.version = "1.1";
    this.path = "modules/moderation";
    this.db = true;

  }

  public run = async (): Promise<void> => {
    await this.load();
  }

  readonly moduleData: moduleData = {
    version: this.version,
    guildID: "",
    cases: [],
    settings: {
      caseLimit: 100,
      infractionUntilBan: 12,
      infractionUntilKick: 6,
      infractionUntilTimeout: 3
    }
  }

}