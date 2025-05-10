import type * as main from "./interfaces/MainModuleData";
import type * as log from "./interfaces/LoggingModuleData";
import type * as vc from "./interfaces/VCModuleData";
import type * as moderation from "./interfaces/ModerationModuleData";
import type * as roles from "./interfaces/RolesModuleData";
import type * as starboard from "./interfaces/StarboardModuleData";

export type ModuleName = "Main" | "Logging" | "VC" | "Moderation" | "Roles" | "Starboard";

export type ModuleDataMap = {
  Main: main.MainModuleData;
  Logging: log.LoggingModuleData;
  VC: vc.VCModuleData
  Moderation: moderation.ModerationModuleData;
  Roles: roles.RolesModuleData;
  Starboard: starboard.StarboardModuleData;
}