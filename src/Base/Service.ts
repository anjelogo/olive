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

export type Ctx<T extends "user" | "guild"> = T extends "guild"
  ? { guildID: string }
  : { userID: string };

export type DataFor<T extends "user" | "guild"> = ModuleDataMap<T>;

export type ContextForKey<K> = K extends keyof ModuleDataMap<"guild">
  ? "guild"
  : K extends keyof ModuleDataMap<"user">
  ? "user"
  : never;

export interface InputField {
  label: string;
  type:
    | "checkbox"
    | "number"
    | "long_input"
    | "short_input"
    | "list_input"
    | "list_select";
  action: string;
  module: ModuleName;
  data:
    | DeepPartial<
        // Allow any guild module data or the user module data
        | ModuleDataMap<"guild">[keyof ModuleDataMap<"guild">]
        | ModuleDataMap<"user">["User"]
      >
    | undefined; // data to be sent to the module
  permissions: string[];
  description?: string;
  max_selection?: number; // max selection for dropdown
  min_selection?: number; // min selection for dropdown
  options?: {
    label: string;
    value: string;
    icon?: string;
  }[];
}

export default abstract class Service<T extends "user" | "guild"> {
  protected bot: ExtendedClient;
  protected router: Router;
  protected abstract fields: InputField[];
  protected readonly context: T;

  constructor(bot: ExtendedClient, context: T) {
    this.bot = bot;
    this.router = Router({ mergeParams: true });
    this.context = context;
    this.initRouteHandlers();
  }

  // CHANGED: method instead of property
  protected getRouteHandlers(): Record<
    string,
    (req: Request, res: Response) => void
  > {
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

  private async ensureContext(
    req: Request,
    res: Response
  ): Promise<Ctx<T> | undefined> {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "ID is required" });
      return;
    }

    if (this.context === "guild") {
      const guild = this.bot.findGuild?.(id);
      if (!guild) {
        res.status(404).json({ error: "Guild not found" });
        return;
      }
      return { guildID: id } as Ctx<T>;
    } else {
      const user = this.bot.findUser?.(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      return { userID: id } as Ctx<T>;
    }
  }

  protected async get<K extends keyof DataFor<ContextForKey<K>>>(
    req: Request,
    res: Response,
    data: { message: string; data: DeepPartial<DataFor<ContextForKey<K>>[K]> }
  ): Promise<void>;
  protected async get(
    req: Request,
    res: Response,
    data: { message: string; data: InputField[] }
  ): Promise<void>;
  protected async get(
    req: Request,
    res: Response,
    data: { message: string; data: unknown }
  ): Promise<void> {
    try {
      const context = await this.ensureContext(req, res);
      if (!context) return;

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Error",
        error,
      });
    }
  }

  protected async post<K extends keyof DataFor<ContextForKey<K>>>(
    req: Request,
    res: Response,
    data: { message: string; data: DeepPartial<DataFor<ContextForKey<K>>[K]> }
  ): Promise<void> {
    try {
      const context = await this.ensureContext(req, res);
      if (!context) return;

      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Error",
        error: error,
      });
    }
  }

  protected async put<K extends keyof DataFor<ContextForKey<K>>>(
    req: Request,
    res: Response,
    data: { message: string; data: DeepPartial<DataFor<ContextForKey<K>>[K]> }
  ): Promise<void> {
    try {
      const context = await this.ensureContext(req, res);
      if (!context) return;

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Error",
        error: error,
      });
    }
  }

  protected async delete<K extends keyof DataFor<ContextForKey<K>>>(
    req: Request,
    res: Response,
    data: { message: string; data: DeepPartial<DataFor<ContextForKey<K>>[K]> }
  ): Promise<void> {
    try {
      const context = await this.ensureContext(req, res);
      if (!context) return;

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Error",
        error: error,
      });
    }
  }

  protected abstract updateData<
    K extends keyof ModuleDataMap<ContextForKey<K>>
  >(
    params: { module: K; ctx: Ctx<ContextForKey<K>> },
    data: DeepPartial<ModuleDataMap<ContextForKey<K>>[K]>
  ): Promise<ModuleDataMap<ContextForKey<K>>[K]>;

  getRouter(): Router {
    return this.router;
  }

  protected getBodyData<K extends keyof DataFor<T>>(
    module: K,
    key: string,
    body: DeepPartial<DataFor<T>[K]>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> | undefined {
    if (!body || typeof body !== "object") return undefined;

    if (key in body) return body;

    for (const k in body) {
      const value = body[k];
      if (typeof value === "object") {
        const result = this.getBodyData<K>(
          module,
          key,
          value as DeepPartial<DataFor<T>[K]>
        );
        if (result !== undefined) return result;
      }
    }

    return undefined;
  }
}
