import { Permissions } from "../../modules/main/internals/permissions";
import { ModuleName } from "../ModuleTypes";
import { BaseModuleData } from "./BaseModuleData";

export interface MainModuleData extends BaseModuleData {
  permissions: Permissions[];
  disabledModules: ModuleName[];
}