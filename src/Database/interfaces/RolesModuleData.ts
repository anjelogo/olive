import { PartialEmoji } from "oceanic.js";
import { BaseModuleData } from "./BaseModuleData";

export interface SavedRolesStructure {
  userID: string;
  roles: string[];
}

export interface RolesMessage {
  id: string;
  channelID: string;
  roles: {
    role: string;
    emote: PartialEmoji;
  }[];
}

export interface RolesModuleData extends BaseModuleData {
  roles: string[];
  autoRoles: string[];
  messages: RolesMessage[];
  savedRoles: {
    enabled: boolean;
    roles: SavedRolesStructure[];
  };
}