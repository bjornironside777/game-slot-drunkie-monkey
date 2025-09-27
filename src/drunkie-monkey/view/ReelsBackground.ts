import { Spine } from 'pixi-spine';
import AssetsManager from '../../gamma-engine/core/assets/AssetsManager';
import IAdjustableLayout from '../../gamma-engine/core/view/IAdjustableLayout';
import { ScreenOrientation } from '../../gamma-engine/core/view/ScreenOrientation';
import {Sprite} from "pixi.js";

export default class ReelsBackground extends Sprite {

    constructor() {
        super(AssetsManager.textures.get('reel'));


    }

    // PUBLIC API
    public reset() {

    }
}
