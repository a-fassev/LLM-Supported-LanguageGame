import { z } from "zod";

/** Path segment under Resources/UI/GameArt (lowercase alnum, slash, underscore, hyphen). */
export const gameArtAssetKeySchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9/_-]+$/, "invalid GameArt asset key (use lowercase path segments)");

export const optionalSceneBackgroundAssetSchema = gameArtAssetKeySchema.optional();

export const optionalAssetIdSchema = gameArtAssetKeySchema.optional();

export const taskContentCommonFields = {
  sceneBackgroundAsset: optionalSceneBackgroundAssetSchema,
};
