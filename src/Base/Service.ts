import { Request, Response, Router } from "express";
import ExtendedClient from "./Client";

export interface InputField {
  label: string;
  type: "checkbox" | "number" | "long_input" | "short_input" | "dropdown";
  action: string;
  currentValue?: {
    checkbox: boolean;
    number: number;
    long_input: string;
    short_input: string;
    dropdown: string[];
  }[InputField["type"]]
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

  protected async get(req: Request, res: Response, data: { message: string, data: any }): Promise<void> {
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

  protected async post(req: Request, res: Response, data: { message: string, data: any }): Promise<void> {
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

  protected async put(req: Request, res: Response, data: { message: string, data: any }): Promise<void> {
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

  protected async delete(req: Request, res: Response, data: { message: string, data: any}): Promise<void> {
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

  protected abstract updateData(params: any, data: any): Promise<any>;

  getRouter(): Router {
    return this.router;
  }




}