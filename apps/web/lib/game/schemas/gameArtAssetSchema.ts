import { z } from "zod";

/** Path segment under Resources/UI/GameArt (alnum, slash, underscore, hyphen). */
export const gameArtAssetKeySchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-zA-Z0-9/_-]+$/, "invalid GameArt asset key");

export const optionalSceneBackgroundAssetSchema = gameArtAssetKeySchema.optional();

export const optionalAssetIdSchema = gameArtAssetKeySchema.optional();

export const taskContentCommonFields = {
  sceneBackgroundAsset: optionalSceneBackgroundAssetSchema,
};
