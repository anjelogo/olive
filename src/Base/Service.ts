import { Request, Response, Router } from "express";
import ExtendedClient from "./Client";

export interface InputFields {
  label: string;
  description?: string;
  type: ("checkbox" | "number" | "long_input" | "short_input" | "dropdown");
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
  protected abstract fields: InputFields[];
  protected abstract routeHandlers: Record<string, (req: Request, res: Response) => void>;


  constructor(bot: ExtendedClient) {
    this.bot = bot;
    this.router = Router();
    this.initRouteHandlers();
  }

  private initRouteHandlers() {
    for (const [path, handler] of Object.entries(this.routeHandlers)) {
      this.router.get(path, handler);
      this.router.post(path, handler);
      this.router.put(path, handler);
      this.router.delete(path, handler);
      this.router.patch(path, handler);
    }
  }

  protected async get(req: Request, res: Response, data: any): Promise<void> {
    try {
      res
        .status(200)
        .json({
          message: "Success",
          data: data,
        });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error",
          error: error,
        });
    }
  }

  protected async post(req: Request, res: Response, data: any): Promise<void> {
    try {
      res
        .status(201)
        .json({
          message: "Created",
          data: data,
        });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error",
          error: error,
        });
    }
  }

  protected async put(req: Request, res: Response, data: any): Promise<void> {
    try {
      const result = await this.updateData(req.params, data);
      res
        .status(200)
        .json({
          message: "Updated",
          data: result,
        });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error",
          error: error,
        });
    }
  }

  protected async delete(req: Request, res: Response, data: any): Promise<void> {
    try {
      res
        .status(200)
        .json({
          message: "Deleted",
          data: data,
        });
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