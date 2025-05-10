import { Permissions } from "../../modules/main/internals/permissions";
import { BaseModuleData } from "./BaseModuleData";

export interface MainModuleData extends BaseModuleData {
  permissions: Permissions[];
  disabledModules: string[];
}