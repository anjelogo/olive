import { Request, Response, Router } from "express";
import { ModuleDataMap, ModuleName } from "../Database/ModuleTypes";
import ExtendedClient from "./Client";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[P]>
    : T[P];
};

export interface InputField {
  label: string;
  type: "checkbox" | "number" | "long_input" | "short_input" | "list_input" | "list_select";
  action: string;
  module: keyof ModuleDataMap;
  data: DeepPartial<ModuleDataMap[this["module"]]> | undefined; // data to be sent to the module
  permissions: string[];
  description?: string;
  max_selection?:  number; // max selection for dropdown
  min_selection?: number; // min selection for dropdown
  options?: {
    label: string;
    value: string;
    icon?: string;
  }[];
}

export default abstract class Service {
  protected bot: ExtendedClient;
  protected router: Router;
  protected abstract fields: InputField[];

  constructor(bot: ExtendedClient) {
    this.bot = bot;
    this.router = Router({ mergeParams: true });
    this.initRouteHandlers();
  }

  // CHANGED: method instead of property
  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {};
  }

  private initRouteHandlers() {
    const handlers = this.getRouteHandlers();

    for (const [path, handler] of Object.entries(handlers)) {
      this.router.get(path, handler);
      this.router.post(path, handler);
      this.router.put(path, handler);
      this.router.delete(path, handler);
      this.router.patch(path, handler);
    }
  }

  private async checkForGuild(req: Request, res: Response): Promise<string | undefined> {
    const guildID = req.params.id;
    if (!guildID) {
      res.status(400).json({ error: "Guild ID is required" });
      return;
    }

    const guild = this.bot.findGuild(guildID);
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }

    return guildID; // return ID so you can use it directly
  }

  protected async get<K extends keyof ModuleDataMap>(req: Request, res: Response, data: { message: string; data: DeepPartial<ModuleDataMap[K]>; } ): Promise<void>; 
  protected async get(req: Request, res: Response, data: { message: string; data: InputField[]; }): Promise<void>;
  protected async get(req: Request, res: Response, data: { message: string; data: unknown; }): Promise<void> {
    try {
      const guildID = await this.checkForGuild(req, res);
      if (!guildID) return;

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Error",
        error
      });
    }
  }

  protected async post<K extends keyof ModuleDataMap>(req: Request, res: Response, data: { message: string, data: DeepPartial<ModuleDataMap[K]> }): Promise<void> {
    try {
      const guildID = await this.checkForGuild(req, res);
      if (!guildID) return;
      
      res
        .status(201)
        .json(data);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error",
          error: error,
        });
    }
  }

  protected async put<K extends keyof ModuleDataMap>(req: Request, res: Response, data: { message: string, data: DeepPartial<ModuleDataMap[K]> }): Promise<void> {
    try {
      const guildID = await this.checkForGuild(req, res);
      if (!guildID) return;
      
      res
        .status(200)
        .json(data);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error",
          error: error,
        });
    }
  }

  protected async delete<K extends keyof ModuleDataMap>(req: Request, res: Response, data: { message: string, data: DeepPartial<ModuleDataMap[K]>}): Promise<void> {
    try {
      const guildID = await this.checkForGuild(req, res);
      if (!guildID) return;
      
      res
        .status(200)
        .json(data);
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error",
          error: error,
        });
    }
  }

  protected abstract updateData<K extends keyof ModuleDataMap>(
    params: { module: K; guildID: string }, // or whatever context you need
    data: DeepPartial<ModuleDataMap[K]>
  ): Promise<ModuleDataMap[K]>;

  getRouter(): Router {
    return this.router;
  }

  protected getBodyData<K extends keyof ModuleDataMap>(
    module: K,
    key: string,
    body: DeepPartial<ModuleDataMap[K]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> | undefined {
    if (!body || typeof body !== "object") return undefined;

    if (key in body) return body;

    for (const k in body) {
      const value = body[k];
      if (typeof value === "object") {
        const result = this.getBodyData<K>(module, key, value as DeepPartial<ModuleDataMap[K]>);
        if (result !== undefined) return result;
      }
    }

    return undefined;
  }

}