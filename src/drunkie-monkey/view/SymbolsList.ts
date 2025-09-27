import { SymbolData } from '../../gamma-engine/slots/view/SymbolData';
import SoundListExtended from "../sound/SoundListExtended";


export const SymbolsList: SymbolData[] = [
    {
        id: 101,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'lp_1'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-00',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_LOW_PAYOUT_1,
            volume: 0.15
        }
    },
    {
        id: 102,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'lp_2'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-01',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_LOW_PAYOUT_2,
            volume: 0.15
        }
    },
    {
        id: 103,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'lp_3'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-02',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_LOW_PAYOUT_3,
            volume: 0.15
        }
    },
    {
        id: 104,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'hp_4'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-08',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_HIGH_PAYOUT_4,
            volume: 0.15
        }
    },
    {
        id: 201,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'hp_1'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-05',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_HIGH_PAYOUT_1,
            volume: 0.15
        }
    },
    {
        id: 202,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'hp_2'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-06',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_HIGH_PAYOUT_2,
            volume: 0.15
        }
    },
    {
        id: 203,
        poolSize: 12,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'hp_3'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-07',
            winAnimationName:['match', 'destroy'],
            idleAnimationName: 'static'
        },
        destroyAnimation: {
            spineAssetName: 'symbol-destroy-animation',
            animationName: 'destroy'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_HIGH_PAYOUT_3,
            volume: 0.15
        }
    },
    {
        id: 25,
        poolSize: 7,
        staticIcon: {
            sourceType: 'texture',
            assetName: 'scatter'
        },
        spinIcon: {
            sourceType: 'texture',
            assetName: 'blank',
            blurY: 20
        },
        spineAnimations:{
            spineAssetName:  'symbol-scatter',
            winAnimationName:['land', 'match'],
            idleAnimationName: 'static'
        },
        winSound:{
            id: SoundListExtended.SYMBOL_SCATTER,
            volume: 0.15
        },
        landSound:{
            id: SoundListExtended.SYMBOL_SCATTER_LAND,
            volume: 0.15
        }
    },
];

export type MultiplierSymbolData = {
    id: number;
    textTexture: string,
    backgroundTexture: string
}


export const MultiplierSymbolsList: MultiplierSymbolData[] = [
    {
        id: 1,
        textTexture: '',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 2,
        textTexture: '2X',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 4,
        textTexture: '4X',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 8,
        textTexture: '8X',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 16,
        textTexture: '16X',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 32,
        textTexture: '32X',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 64,
        textTexture: '64X',
        backgroundTexture: 'Multiplier'
    },
    {
        id: 128,
        textTexture: '128X',
        backgroundTexture: 'Multiplier'
    }
]
