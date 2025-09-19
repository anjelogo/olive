export type BaseModuleData<T extends "user" | "guild"> = 
  T extends "user"
  ? { userID: string; guildID?: never }
  : { guildID: string; userID?: never }
  & {
    enabled: boolean;
    version: number;
  }
