import {Spine} from 'pixi-spine';
import AssetsManager from '../../gamma-engine/core/assets/AssetsManager';
import {Container, DisplayObject, Sprite} from 'pixi.js';
import Sound from '../../gamma-engine/core/sound/Sound';
import SoundManager from '../../gamma-engine/core/sound/SoundManager';
import SoundListExtended from '../sound/SoundListExtended';
import IAdjustableLayout from '../../gamma-engine/core/view/IAdjustableLayout';
import {UpdateLayoutDescription} from '../../gamma-engine/core/view/UpdateLayoutDescription';
import SoundList from "../../gamma-engine/common/sound/SoundList";
import {ScreenOrientation} from "../../gamma-engine/core/view/ScreenOrientation";
import { Tweener } from '../../gamma-engine/core/tweener/engineTween';
import NoSleep from 'nosleep.js';
import { getFromLocalStorage } from '../model/LocalStorageUtils';

export default class MainScreenBackground extends Container implements IAdjustableLayout{
    private static DEFAULT_BACKGROUND_CHANNEL: string = 'ambient';

    private _theme: BackgroundType;
    private backgroundMusic: Sound;

    private currentAnimation: Spine;
    public nosleep:NoSleep;
    // private currentSprite:Sprite

    // VISUALS
    private mainAnimation: Spine;
    // private backgroundSpriteNormal: Sprite;

    // private backgroundSpriteFreegame: Sprite;
    private freegameAnimation: Spine;
    // private staticBackground:Sprite;
    constructor() {
        super();
        //
        this.mainAnimation = new Spine(AssetsManager.spine.get(BackgroundType.NORMAL));
        // this.backgroundSpriteNormal = new Sprite(AssetsManager.textures.get(BackgroundType.NORMAL));
        // this.backgroundSpriteFreegame = new Sprite(AssetsManager.textures.get(BackgroundType.FREEGAME));
        this.freegameAnimation = new Spine(AssetsManager.spine.get(BackgroundType.FREEGAME));
        var self = this
        this.nosleep = new NoSleep()
         if(getFromLocalStorage('settings')?.introScreen )
            {
                this.nosleep.enable();  
                setTimeout(() => {
                    self.updateBackgroundMusic();
              }, 1000);
             }    
         document.body.addEventListener('pointerdown', () => {
            this.nosleep.enable();
            setTimeout(() => {
                  self.updateBackgroundMusic();
            }, 1000);
          }, { once: true });
        document.addEventListener('visibilitychange', () => {
            const { ctx } = Howler;
            if (document.visibilityState !== "hidden") {
                setTimeout(() => {
                    self.updateBackgroundMusic();
                }, 100);
            } 
        });
        document.addEventListener('focus', () => {
            setTimeout(() => {
                self.updateBackgroundMusic();
            }, 100);
        });
        this.theme = BackgroundType.NORMAL;
        setTimeout(() => {
            self.updateBackgroundMusic();
        }, 1000)
    }


    public set theme(type: BackgroundType) {
        if (this._theme === type)
            return;

        this._theme = type;

        switch (this._theme) {
            case BackgroundType.NORMAL:
                this.swap(this.mainAnimation,'bg_loop',true);
                break;
            case BackgroundType.FREEGAME:
                SoundManager.play(SoundList.TRANSITION);
                this.swap(this.freegameAnimation,'freespinBG_anim',true);
                break;
        }
    }

    // private swap(spine:Spine,background:Sprite): void {
    //     if (this.children.length == 0) {
    //         background.pivot.set(background.width / 2, background.height / 2);
    //         this.addChild(background);
    //         this.addChild(spine);
    //         spine.state.setAnimation(0, 'idle', true);
    //         return;
    //     }

    //     const prevBackround: DisplayObject = this.children[0];

    //     Tweener.addTween(background, {
    //         alpha: 1,
    //         time: 0.75,
    //         transition: 'easeOutSine',
    //         onStart: () => {
    //             this.addChild(background);
    //             background.alpha = 0;
    //             background.pivot.set(background.width / 2, background.height / 2);
    //         },
    //         onComplete: () => {

    //             this.removeChild(prevBackround);
    //         }
    //     });

    //     const prevSpineAnimation: Spine = this.children[this.children.length - 1] as Spine;
    //     spine.alpha = 0;
    //     Tweener.addTween(spine, {
    //         alpha: 1,
    //         time: 0.75,
    //         transition: 'easeOutSine',
    //         onStart: () => {
    //             // freegame dont have spine animtaion
    //             if(spine !== this.freegameAnimation) {
    //                 this.addChild(spine);
    //                 spine.state.setAnimation(0, 'idle', true);
    //             }
    //         },
    //         onComplete: () => {

    //             this.removeChild(prevSpineAnimation);
    //         }
    //     });

    //     if (this.backgroundMusic) {
    //         Tweener.addTween(this.backgroundMusic,
    //             {
    //                 volume: 0,
    //                 time: 0.45,
    //                 transition: 'linear',
    //                 onComplete: () => {
    //                     this.backgroundMusic.stop();
    //                     this.updateBackgroundMusic()
    //                 }
    //             });
    //     }
    // }

    private swap(animation: Spine, id: string,loop:boolean): void {
        if (!this.currentAnimation) {
            this.currentAnimation = animation;
            this.addChild(this.currentAnimation);
        } else {
            const prevAnimation: Spine = this.currentAnimation;
            this.currentAnimation = animation;
            this.currentAnimation.alpha = 0;

            this.addChild(this.currentAnimation);
            Tweener.addTween(this.currentAnimation, {
                alpha: 1,
                time: 0.75,
                transition: 'easeOutSine',
                onComplete: () => {
                    prevAnimation.state.setEmptyAnimations(0);
                    this.removeChild(prevAnimation);
                }
            });

            if (this.backgroundMusic) {
                Tweener.addTween(this.backgroundMusic,
                    {
                        volume: 0,
                        time: 0.45,
                        transition: 'linear',
                        onComplete: () => {
                            this.updateBackgroundMusic();
                        }
                    });
            }
        }
        this.currentAnimation.state.setAnimation(0, id, loop);
    }

    private updateBackgroundMusic(): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }

        this.backgroundMusic = SoundManager.loop({
            id: this._theme === BackgroundType.NORMAL ? SoundListExtended.BASEGAME_BACKGROUND : SoundListExtended.FREEGAME_BACKGROUND,
            volume: this._theme === BackgroundType.NORMAL ? 0.1 : 0.2,
            channel: MainScreenBackground.DEFAULT_BACKGROUND_CHANNEL
        });
    }

    public updateLayout(desc: UpdateLayoutDescription) {
        switch (desc.orientation){
            case ScreenOrientation.HORIZONTAL:
                const xScale: number = desc.currentWidth / desc.baseWidth;
                const yScale: number = desc.currentHeight / desc.baseHeight;

                this.scale.set(xScale > yScale ? xScale : yScale);
                break;
            case ScreenOrientation.VERTICAL:
                const offsetX =( desc.currentWidth - desc.baseWidth)/2
                const backgroundWidth = 1920
                this.scale.set((desc.currentHeight / desc.baseHeight) * 2);
                this.pivot.x = -(backgroundWidth/2)
                this.x = 0 - offsetX
                break;
        }
    }
}

export enum BackgroundType {
    NORMAL = 'main-screen-background',
    FREEGAME = 'freegame-screen-background'
}
