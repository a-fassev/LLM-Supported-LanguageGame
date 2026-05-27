#!/usr/bin/env python3
"""Create Unity .meta files for GameArt PNGs (Sprite import) and missing folder metas."""
from __future__ import annotations

import uuid
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
GAME_ART = REPO / "Assets/Resources/UI/GameArt"

TEXTURE_META_TEMPLATE = """fileFormatVersion: 2
guid: {guid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {{}}
  serializedVersion: 13
  mipmaps:
    mipMapMode: 0
    enableMipMap: 0
    sRGBTexture: 1
    linearTexture: 0
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreserveCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  bumpmap:
    convertToNormalMap: 0
    externalNormalMap: 0
    heightScale: 0.25
    normalMapFilter: 0
    flipGreenChannel: 0
  isReadable: 0
  streamingMipmaps: 0
  streamingMipmapsPriority: 0
  vTOnly: 0
  ignoreMipmapLimit: 0
  grayScaleToAlpha: 0
  generateCubemap: 6
  cubemapConvolution: 0
  seamlessCubemap: 0
  textureFormat: 1
  maxTextureSize: 2048
  textureSettings:
    serializedVersion: 2
    filterMode: 1
    aniso: 1
    mipBias: 0
    wrapU: 1
    wrapV: 1
    wrapW: 1
  nPOTScale: 0
  lightmap: 0
  compressionQuality: 50
  spriteMode: 1
  spriteExtrude: 1
  spriteMeshType: 1
  alignment: 0
  spritePivot: {{x: 0.5, y: 0.5}}
  spritePixelsToUnits: 100
  spriteBorder: {{x: 0, y: 0, z: 0, w: 0}}
  spriteGenerateFallbackPhysicsShape: 1
  alphaUsage: 1
  alphaIsTransparency: 1
  spriteTessellationDetail: -1
  textureType: 8
  textureShape: 1
  singleChannelComponent: 0
  flipbookRows: 1
  flipbookColumns: 1
  maxTextureSizeSet: 0
  compressionQualitySet: 0
  textureFormatSet: 0
  ignorePngGamma: 0
  applyGammaDecoding: 0
  swizzle: 50462976
  cookieLightType: 0
  platformSettings:
  - serializedVersion: 4
    buildTarget: DefaultTexturePlatform
    maxTextureSize: 2048
    resizeAlgorithm: 0
    textureFormat: -1
    textureCompression: 1
    compressionQuality: 50
    crunchedCompression: 0
    allowsAlphaSplitting: 0
    overridden: 0
    ignorePlatformSupport: 0
    androidETC2FallbackOverride: 0
    forceMaximumCompressionQuality_BC6H_BC7: 0
  spriteSheet:
    serializedVersion: 2
    sprites: []
    outline: []
    physicsShape: []
    bones: []
    spriteID: 
    internalID: 0
    vertices: []
    indices: 
    edges: []
    weights: []
    secondaryTextures: []
    nameFileIdTable: {{}}
  spritePackingTag: 
  pSDRemoveMatte: 0
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"""

FOLDER_META_TEMPLATE = """fileFormatVersion: 2
guid: {guid}
folderAsset: yes
DefaultImporter:
  externalObjects: {{}}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"""


def write_meta(path: Path, content: str, force: bool = False) -> bool:
    meta = path.with_suffix(path.suffix + ".meta") if path.suffix else Path(str(path) + ".meta")
    if meta.exists() and not force:
        return False
    meta.write_text(content, encoding="utf-8")
    return True


def main() -> None:
    created = 0
    for png in sorted(GAME_ART.rglob("*.png")):
        guid = uuid.uuid4().hex
        if write_meta(png, TEXTURE_META_TEMPLATE.format(guid=guid)):
            created += 1
            print(f"  texture meta: {png.relative_to(REPO)}")

    for folder in sorted(p for p in GAME_ART.rglob("*") if p.is_dir()):
        meta_path = folder / ".meta"
        # Unity uses FolderName.meta not .meta inside folder
        folder_meta = Path(str(folder) + ".meta")
        if folder_meta.exists():
            continue
        guid = uuid.uuid4().hex
        if write_meta(folder, FOLDER_META_TEMPLATE.format(guid=guid)):
            created += 1
            print(f"  folder meta: {folder.relative_to(REPO)}")

    root_meta = GAME_ART / ".meta"
    if not root_meta.exists() and GAME_ART.is_dir():
        guid = uuid.uuid4().hex
        write_meta(GAME_ART, FOLDER_META_TEMPLATE.format(guid=guid))
        created += 1
        print(f"  folder meta: {GAME_ART.relative_to(REPO)}")

    print(f"Created/updated {created} .meta file(s)")


if __name__ == "__main__":
    main()
