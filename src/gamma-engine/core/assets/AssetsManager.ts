import LayoutElement from '../view/model/LayoutElement';
import { BitmapFont, Texture } from 'pixi.js';
import { ISkeletonData } from 'pixi-spine';
import { Howl } from 'howler';

export default class AssetsManager {

    public static layouts: Map<string, LayoutElement> = new Map<string, LayoutElement>();
    public static textures: Map<string, Texture> = new Map<string, Texture>();
    public static animatedTextures: Map<string, Texture[]> = new Map<string, Texture[]>();
    public static spine: Map<string, ISkeletonData> = new Map<string, ISkeletonData>();
    public static videos: Map<string, HTMLVideoElement> = new Map<string, HTMLVideoElement>();
    public static sounds: Map<string, Howl> = new Map<string, Howl>();
    public static xmls: Map<string, XMLDocument> = new Map<string, XMLDocument>();
    public static webFonts: Map<string, FontFace> = new Map<string, FontFace>();
    public static bitmapFonts: Map<string, BitmapFont> = new Map<string, BitmapFont>();
    public static translations: Map<string, string> = new Map<string, string>();
    public static getAnimationTextures(texturePrefix: string): Array<Texture> | null {
        const animationTextures: Array<Texture> = [];
        const keys: Array<string> = [];

        AssetsManager.textures.forEach((texture: Texture, key: string) => {
            if (key.indexOf(texturePrefix) === 0) {
                keys.push(key);
            }
        });

        keys.sort();

        for (const key of keys) {
            if(AssetsManager.textures.has(key)) {
                const animationFrameTexture:Texture = AssetsManager.textures.get(key);
                animationTextures.push(animationFrameTexture);
            }
        }

        if (animationTextures.length) {
            return animationTextures;
        } else {
            return null;
        }
    }

}
