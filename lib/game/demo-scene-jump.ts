import type { CatalogScene } from "@/lib/game/content/catalog-loader";

export type SceneJumpTargetDto = {
  id: string;
  label: string;
};

export function sceneJumpLabel(scene: CatalogScene): string {
  const n = String(scene.sceneNumber).padStart(2, "0");
  if (scene.scene_type === "story") {
    return `${n} · Storia`;
  }
  const content = scene.content as { title?: unknown } | undefined;
  const title =
    typeof content?.title === "string" && content.title.trim() ? content.title.trim() : scene.screen_type;
  return `${n} · ${title}`;
}

export function sceneJumpTargetsForQuest(scenes: CatalogScene[]): SceneJumpTargetDto[] {
  return [...scenes]
    .sort((a, b) => a.sceneNumber - b.sceneNumber)
    .map((scene) => ({ id: scene.id, label: sceneJumpLabel(scene) }));
}
