import { Request, Response } from "express";
import { gatewayInfo } from "../services/gatewayService";

export const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    service: gatewayInfo.name,
    status: "UP"
  });
};

