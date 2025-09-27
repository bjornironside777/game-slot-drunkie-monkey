import { Texture } from 'pixi.js';
import { ISkeletonData } from 'pixi-spine';
import { SoundData } from '../../core/sound/SoundData';
import SymbolView from './SymbolView';

export type SymbolData = {
    id: number;
    poolSize?: number,
    specialViewClass?: typeof SymbolView,

    staticIcon: IconData;
    spinIcon?: IconData;

    spineAnimations?: SpineSymbolAnimations;
    spriteAnimations?: SpriteSymbolAnimations;
    destroyAnimation?: destroySymbolAnimation,

    winSound?: SoundData;
    landSound?: SoundData;

    skipWinFrameAnimation?: boolean;
}

export type IconData = {
    sourceType: 'texture' | 'spine',
    assetName: string,
    animationName?: string,
    skinName?: string,
    blurY?: number,
    texture?: Texture
}

export type FrameByFrameIconAnimation = {
    animationPrefix: string,
    animationTextures?: Texture[],
    fps?: number
}

export type SpineWinFrameAnimation = {
    assetName: string,
    animationName: string
}

export type SpineIconAnimation = {
    spineAssetName: string,
    animationName: string
    skeletonData?: ISkeletonData,
}

export type destroySymbolAnimation = {
    spineAssetName: string,
    animationName: string
}

export type SpineSymbolAnimations = {
    spineAssetName: string,
    skeletonData?: ISkeletonData,
    skinName?: string,
    winAnimationName: string[] | string;
    stopAnimationName?: string;
    idleAnimationName?: string;
    mixTime?: number;
}

export type SpriteSymbolAnimations = {
    winAnimation: FrameByFrameIconAnimation;
    stopAnimation?: FrameByFrameIconAnimation;
    idleAnimation?: FrameByFrameIconAnimation;
}
