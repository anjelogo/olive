type ModuleData = {
  version: string;
  enabled: boolean;
}

export type BaseModuleData<T extends "user" | "guild"> = T extends "user"
  ? { userID: string; guildID?: never } & ModuleData
  : { guildID: string; userID?: never } & ModuleData;
