import { BaseModuleData } from "./BaseModuleData";

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
    autoPunish: {
      enabled: boolean;
      infractionsUntilWarn: number;
      infractionsUntilBan: number;
      infractionsUntilKick: number;
      infractionsUntilTimeout: number;
    }

    /** @deprecated use autoPunish.infractionsUntilBan */
    infractionUntilBan?: number;
    /** @deprecated use autoPunish.infractionsUntilKick */
    infractionUntilKick?: number;
    /** @deprecated use autoPunish.infractionsUntilTimeout */
    infractionUntilTimeout?: number;
}

export interface ModerationModuleData extends BaseModuleData {
    cases: Case[];
    settings: ModerationSettings
}