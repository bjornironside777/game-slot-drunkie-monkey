import { TrackEntry } from '@pixi-spine/runtime-4.1';
import { Spine } from 'pixi-spine';
import { BitmapText, Container, Text } from 'pixi.js';
import { container } from 'tsyringe';
import { Tweener } from '../../../core/tweener/engineTween';
// import { Tweener } from '../../../../../libs/engineTween';
import AssetsManager from '../../../core/assets/AssetsManager';
import Sound from '../../../core/sound/Sound';
import SoundManager from '../../../core/sound/SoundManager';
import Wallet from '../../../slots/model/Wallet';
import SoundList from '../../sound/SoundList';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';

export default class PopupBigWin extends Container {
    private levelAnimationNames: string[] = ['big', 'grand', 'mega', 'super'];
    private animations: Spine[];

    private levelAnimationDurations: number[] = [3, 3, 3, 3];

    readonly level: number | (() => number);

    private winValue: number | (() => number);
    private _value: number;

    // VISUALS
    public animation: Spine;
    public tfAmount: Text | BitmapText;

    private loopedSound: Sound;

    constructor(level: number | (() => number), winValue: number | (() => number), amountText: Text | BitmapText) {
        super();

        // DisplayShortcuts.init();
        this.winValue = winValue;
        this.level = level;
        
        const asset = AssetsManager.spine.get('all_win_popup_anim') 
        ?? this.levelAnimationNames.map(name => AssetsManager.spine.get(`${name}_win`));
        
        this.animations = asset instanceof Array
        ? asset.map(data => new Spine(data))
        : [ new Spine(asset) ]
        
        this.tfAmount = new Text(amountText.text, {
            fontFamily: AssetsManager.webFonts.get('SairaStencilOne').family,
            fill: ["#ffe614"],
            fontSize: 40,
            stroke: '#410456',
            strokeThickness: 4,
            lineJoin: 'round',
        })
        this.tfAmount.anchor.set(0.5, 0.5);
        this.tfAmount.scale.y = -1;
        
        const layout = AssetsManager.layouts.get("PopupBigWin");
        const animationLayout = layout.children.get('animation');
        this.animations.forEach((animation) => {
            const counterContainer: Container = animation.slotContainers[animation.skeleton.findSlotIndex('placeholder')];
            // remove this and uncomment below code once you receive the correct animation having above placeholder;
            if(counterContainer) {
                counterContainer.removeChildren();
                counterContainer.name = 'CounterContainer';
                this.tfAmount.y = 400;
                this.tfAmount.scale.set(2);
                counterContainer.addChild(this.tfAmount);
            } else {
                this.addChild(this.tfAmount);
            }

            // counterContainer.removeChildren();
            // counterContainer.addChild(this.tfAmount);
            // counterContainer.name = 'CounterContainer';
            animation.scale.set(animationLayout.scaleX, animationLayout.scaleY);
            animation.y = animationLayout.y
        });
        
        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    // PUBLIC API
    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        this._value = value;

        const wallet: Wallet = container.resolve(Wallet);
        this.tfAmount.text = wallet.getCurrencyValue(value, true);
    }

    private get levelValue() {
        return this.level instanceof Function ? this.level() : this.level;
    }

    // PRIVATE API
    // private customClassElementCreate(le: LayoutElement): unknown {
    //     let instance: unknown = null;
    //     switch (le.customClass) {
    //         case "BigWinAnimation":
    //             switch (this.levelValue) {
    //                 case 0:
    //                     instance = new Spine(AssetsManager.spine.get("good_win"));
    //                     break;
    //                 case 1:
    //                     instance = new Spine(AssetsManager.spine.get("huge_win"));
    //                     break;
    //                 case 2:
    //                     instance = new Spine(AssetsManager.spine.get("great_win"));
    //                     break;
    //                 case 3:
    //                     instance = new Spine(AssetsManager.spine.get("insane_win"));
    //                     break;
    //             }
    //             break;
    //     }

    //     return instance;
    // }

    private onAdded(): void {
        if (this.levelValue == -1) {
            throw new Error('Big win level not set');
        }

        this.removeChild(this.animation);
        this.animation = this.animations[this.levelValue] ?? this.animations[0];
        this.addChild(this.animation);
        const counterContainer: Container =
            this.animation.slotContainers[this.animation.skeleton.findSlotIndex('win_text')];
        
        // remove this and uncomment below code once you receive the correct animation having above placeholder;
        if(counterContainer) {
            counterContainer.removeChildren();
            counterContainer.addChild(this.tfAmount);
        } else {
            this.tfAmount.y = 400;
            this.tfAmount.scale.set(2);
            this.addChild(this.tfAmount);
        }
        
        // counterContainer.removeChildren();
        // counterContainer.addChild(this.tfAmount);

        const levelAnimationName: string = this.levelAnimationNames[this.levelValue];
        const levelAnimationDuration: number = this.levelAnimationDurations[this.levelValue];

        // spec says 5 secs animating, so we put 4 + 1 in + 1 out
        const numLoopAnimations: number = Math.ceil(5 / levelAnimationDuration);
        // this.animation.pivot.y=-this.animation.height/2;
        this.animation.scale.set(1.1)
        this.animation.state.setEmptyAnimations(0);
        const countUpDuration: number = 4;
        this.animation.state.addListener({
            start: (entry: TrackEntry) => {
                if (entry.animation.name.includes('_win_in')) {
                    this.tfAmount.alpha = 0;
                    Tweener.addTween(this.tfAmount, {
                        alpha: 1,
                        time: 0.3,
                        // angle:90,
                        transition: 'easeOutQuad',
                        delay: 0.3,
                    });

                    this.tfAmount.scale.set(0.3, -0.3);
                    Tweener.addTween(this.tfAmount.scale, {
                        x: 3,
                        y: 3,
                        time: countUpDuration / 8,
                        transition: 'easeOutBack',
                        delay: 0.3,
                    });
                } else if (entry.animation.name.includes('_win_out')) {
                    Tweener.addTween(this.tfAmount, {
                        alpha: 0,
                        time: 1,
                        transition: 'easeInQuad',
                        delay: 0.3
                    });
                }
            },
        });

        this.value = 0;
        Tweener.addTween(this, {
            value: this.winValue instanceof Function ? this.winValue() : this.winValue,
            time: countUpDuration,
            transition: 'easeInOutQuad',
            onStart: () => {
                this.loopedSound = SoundManager.loop({
                    id: SoundList.COUNTER_LOOP,
                    volume: 0.25,
                });
            },
            onComplete: () => {
                this.loopedSound.stop();
                SoundManager.play({
                    id: SoundList.COUNTER_END,
                    volume: 0.4,
                });
            },
        });

        
        this.animation.stateData.setMix(`${levelAnimationName}_win_in`, `${levelAnimationName}_win_loop`, 0.7);
        this.animation.state.setAnimation(0, `${levelAnimationName}_win_in`, false);
        for (let i = 0; i < numLoopAnimations; i++) {
            this.animation.state.addAnimation(0, `${levelAnimationName}_win_loop`, false, 0);
        }
        this.animation.state.addAnimation(0, `${levelAnimationName}_win_out`, false, 0);
    }

    private onRemoved(): void {
        if (this.loopedSound) this.loopedSound.stop();
        Tweener.removeTweens(this);
        Tweener.removeTweens(this.tfAmount);
        Tweener.removeTweens(this.tfAmount.scale);
        this.animations.forEach((animation) => {
            animation.state.setEmptyAnimations(0);
            animation.state.clearListeners();
            animation['lastTime'] = null;
        });
    }
     public updateLayout(desc:UpdateLayoutDescription){
        this.animations.forEach((animation) => {
            if(desc.orientation==ScreenOrientation.HORIZONTAL)
                animation.x=0;
            else
            animation.x=35;
        });
    }
    public skipCounter():void{
        Tweener.removeTweens(this);
        this.value =  this.winValue instanceof Function ? this.winValue() : this.winValue;
    }
}
