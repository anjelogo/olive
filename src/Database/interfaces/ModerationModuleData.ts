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
    infractionUntilBan: number;
    infractionUntilKick: number;
    infractionUntilTimeout: number;
}

export interface ModerationModuleData extends BaseModuleData {
    cases: Case[];
    settings: ModerationSettings
}