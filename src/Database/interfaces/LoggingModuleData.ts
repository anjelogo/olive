import { BaseModuleData } from "./BaseModuleData";

export interface DataType { channelID?: string, caseID?: string; starID?: string; }

export interface DataStructure {
  channelID: string;
  messageID: string;
}

export type LogChannelTypes = ("welcome" | "vc" | "moderation" | "starboard");

export interface LoggingModuleData extends BaseModuleData<"guild"> {
  guildID: string;
  channels: {
    types: LogChannelTypes[];
    channelID: string;
    cases?: {
      channelID: string;
      messageID: string;
      caseID: string;
      lastSeen?: string;
      broken?: boolean;
    }[];
    stars?: {
      channelID: string;
      messageID: string;
      starID: string;
    }[]; 
  }[]
}