import { Permissions } from "../../modules/main/internals/permissions";
import { ModuleName } from "../ModuleTypes";
import { BaseModuleData } from "./BaseModuleData";

export interface MainModuleData extends BaseModuleData<"guild"> {
  guildID: string;
  permissions: Permissions[];
  disabledModules: ModuleName[];
}