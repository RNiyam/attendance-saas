import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import { getFileStorageProvider } from "./file-storage.service";

const router = Router();

const uploadSchema = z.object({
  folder: z.string().min(1),
  filename: z.string().min(1),
  base64Content: z.string().min(1),
  contentType: z.string().optional(),
});

router.use(authMiddleware, resolvePermissions);

router.post("/upload", requirePermission("UPDATE_EMPLOYEE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = uploadSchema.parse(req.body);
    const content = Buffer.from(body.base64Content, "base64");
    const result = await getFileStorageProvider().upload({
      organizationId: req.user!.organizationId,
      folder: body.folder,
      filename: body.filename,
      content,
      contentType: body.contentType,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

export { router as filesRouter };
