import { BaseModuleData } from "./BaseModuleData";

export interface DataType { channelID?: string, caseID?: string; starID?: string; }

export interface DataStructure {
  channelID: string;
  messageID: string;
}

export type LogChannelTypes = ("welcome" | "vc" | "moderation" | "starboard");

export interface LoggingModuleData extends BaseModuleData {
  channels: {
    types: LogChannelTypes[];
    channelID: string;
    cases?: {
      channelID: string;
      messageID: string;
      caseID: string;
    }[];
    stars?: {
      channelID: string;
      messageID: string;
      starID: string;
    }[]; 
  }[]
}