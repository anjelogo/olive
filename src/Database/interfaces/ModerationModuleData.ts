import { BaseModuleData } from "./BaseModuleData";

export type CaseActionTypes = "ban" | "kick" | "timeout" | "warn";

export type Case =
  | ({
      action: "ban" | "timeout";
      expiresAt: string | null;
      duration: string | null;
    } & BaseCase)
  | ({
      action: "kick" | "warn";
      expiresAt?: never;
      duration?: never;
    } & BaseCase);

interface BaseCase {
  id: string;
  userID: string;
  moderatorID: string;
  timestamp: string; // ISO timestamp
  reason?: string;
  resolved?: {
    moderatorID: string;
    reason: string;
  };

  /** @deprecated use expiresAt & duration */
  time?: string
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