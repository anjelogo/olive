import { BaseModuleData } from "./BaseModuleData";

export interface messageDataStructure {
  channelID: string;
    messageID: string;
  authorID: string;
    stars: string[];
}

export interface StarboardModuleData extends BaseModuleData {
    messages: messageDataStructure[];
}