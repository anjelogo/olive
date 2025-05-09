import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";

const userRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
    const userID = req.params.id;

    if (!userID) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    const user = client.findUser(userID);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    res.status(200).json({
      user
    });
    return;
  });

  return router;
};

export default userRoute;