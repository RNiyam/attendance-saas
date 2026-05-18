import { Router } from "express";
import * as referenceRead from "./reference-read.service";

const router = Router();

router.get("/states", async (_req, res, next) => {
  try {
    const states = await referenceRead.listStates();
    res.json({ states });
  } catch (e) {
    next(e);
  }
});

router.get("/states/:stateCode/cities", async (req, res, next) => {
  try {
    const data = await referenceRead.listCitiesForStateCode(String(req.params.stateCode ?? ""));
    if (!data) {
      res.status(404).json({ error: "Unknown state code" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/sectors", async (_req, res, next) => {
  try {
    const sectors = await referenceRead.listSectors();
    res.json({ sectors });
  } catch (e) {
    next(e);
  }
});

router.get("/sectors/:sectorCode/sub-sectors", async (req, res, next) => {
  try {
    const data = await referenceRead.listSubSectorsForSectorCode(String(req.params.sectorCode ?? ""));
    if (!data) {
      res.status(404).json({ error: "Unknown sector" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/enums/:enumType", async (req, res, next) => {
  try {
    const items = await referenceRead.listEnumsByType(String(req.params.enumType ?? ""));
    res.json({ enumType: req.params.enumType, items });
  } catch (e) {
    next(e);
  }
});

export { router as referenceRouter };
