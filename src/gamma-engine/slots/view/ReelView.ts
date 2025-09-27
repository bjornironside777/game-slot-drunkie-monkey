import { AnimatedSprite, Container, DisplayObject, Graphics, Point, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import SoundManager from '../../core/sound/SoundManager';
import Sound from '../../core/sound/Sound';
import { autoscaleText, randomArrayElement, removeArrayElement } from '../../core/utils/Utils';
import { SymbolData } from './SymbolData';
import SymbolView from './SymbolView';
import { SymbolViewEvent } from './event/SymbolViewEvent';
import LayoutElement from '../../core/view/model/LayoutElement';
import LayoutBuilder from '../../core/utils/LayoutBuilder';
import { ReelDescription } from '../model/SlotMachineDescription';
import { SoundData } from '../../core/sound/SoundData';
import { SpinResult } from '../model/RoundResult';
import SlotMachine from '../model/SlotMachine';
import { container } from 'tsyringe';
import AssetsManager from '../../core/assets/AssetsManager';
import { Tweener } from '../../core/tweener/engineTween';
import { MultiplierSymbolView } from './MultiplierSymbolView';
import SymbolViewPool from './SymbolViewPool';

export default class ReelView extends Container {

    private startTiltSize: number = 60;
    private startTiltTime: number = 0.3;
    private blurSpinTime: number = 0.5;
    private cascadeTime: number = 0.4;

    private gameSpeedLevel: number = 0;
    private fallingCascade: boolean = false;

    private reel: ReelDescription;
    private spinResult: number[]
    private multiplierResult: number[]
    private symbols: Map<number, SymbolData>;
    private symbolSize: Point;

    private output: number[];
    private multiplierOutput: number[];

    private spinSound: Sound = null;
    private anticipationSound: Sound = null;

    private visibleSymbols: SymbolView[];
    private multiplierSymbols: MultiplierSymbolView[];

    private mainStripe: Container;
    private spinStripe1: Container;
    private spinStripe2: Container;

    // VISUALS
    public spinContainer: Container;
    public multiplierContainer: Container;
    public reelMask: Graphics;
    public anticipationAnimation: AnimatedSprite;

    constructor(le: LayoutElement, reel: ReelDescription, spinResult: number[], multiplierResult: number[],symbols: Map<number, SymbolData>, symbolSize: Point, fallingCascade: boolean, private symbolsPool: SymbolViewPool) {
        super();

        LayoutBuilder.create(le, this);

        this.spinContainer.mask = this.reelMask;

        this.reel = reel;
        this.spinResult = spinResult;
        this.multiplierResult = multiplierResult;
        this.symbols = symbols;
        this.symbolSize = symbolSize;

        this.mainStripe = new Container();
        this.spinContainer.addChild(this.mainStripe);

        this.spinStripe1 = new Container();
        this.spinStripe1.name = 'spinStrip1';
        this.spinContainer.addChild(this.spinStripe1);

        this.spinStripe2 = new Container();
        this.spinStripe2.name = 'spinStrip2';
        this.spinContainer.addChild(this.spinStripe2);

        if (this.anticipationAnimation)
            this.anticipationAnimation.alpha = 0;

        this.output = [];
        for (let i = 0; i < this.reel.numRows; i++) {
            this.output.push(this.spinResult[i]);
        }

        this.multiplierOutput = [];
        for (let i = 0; i < this.reel.numRows; i++) {
            this.multiplierOutput.push(this.multiplierResult[i]);
        }
        for (let i = 0; i < (this.output.length + 2); i++) {
            this.spinStripe1.addChild(new Sprite());
            this.spinStripe2.addChild(new Sprite());
        }
        this.fallingCascade = fallingCascade;

        this
            .on('added', this.onAdded, this)
            .on('removed', this.onRemoved, this);
    }

    // PUBLIC API
    public spin(gameSpeedLevel: number = 0, startDelay: number = 0, spinSound: SoundData = null): void {
        this.reset();

        this.gameSpeedLevel = gameSpeedLevel;
        const startTiltTime: number = this.gameSpeedLevel == 0 ? this.startTiltTime : 0;
        const multiplierDisappearDelay = this.gameSpeedLevel === 0 ? 1 : 0.2;

        Tweener.addTween(this.mainStripe, {
            y: this.gameSpeedLevel == 0 ? -this.symbolSize.y - this.startTiltSize : -this.symbolSize.y,
            time: startTiltTime,
            transition: 'easeOutQuad',
            delay: startDelay,
            // onStart:()=>{
            //     if(this.fallingCascade) {
            //         this.visibleSymbols.forEach((symbol, index) => {
            //             symbol.animateY(0, (this.visibleSymbols[this.visibleSymbols.length - 1].y + this.symbolSize.y), 1.2, (this.visibleSymbols.length - (index + 1)) * 0.05);
            //         });
            //     }
            // },
            onComplete: () => {
                if (spinSound) {
                    this.spinSound = SoundManager.play(spinSound);
                }
            }
        });

        Tweener.addTween(this.mainStripe, {
            y: this.symbolSize.y * (this.reel.numRows + 1),
            time: 0.4,
            transition: 'easeInSine',
            delay: startTiltTime + startDelay
        });

        this.buildSpinStripe(this.spinStripe1, this.output.length + 2);
        this.buildSpinStripe(this.spinStripe2, this.output.length + 2);
        this.spinStripe1.y = -this.spinStripe1.height * 2;
        this.spinStripe2.y = -this.spinStripe2.height * 2;
        this.spinBlur(this.spinStripe1, startTiltTime + 0.1 + startDelay);
    }

    public async stop(output: number[], stopSound: SoundData = null): Promise<void> {
        Tweener.removeTweens(this.mainStripe);
        Tweener.removeTweens(this.spinStripe1);
        Tweener.removeTweens(this.spinStripe2);

        this.output = output;
        const stopTime: number = this.gameSpeedLevel == 0 ? 0.3 : 0.2;

        return new Promise<void>((resolve) => {
            Tweener.addTween(this.spinStripe1, {
                y: this.symbolSize.y * (this.reel.numRows + 1),
                time: stopTime,
                transition: 'easeOutQuad',
            });
            Tweener.addTween(this.spinStripe2, {
                y: this.symbolSize.y * (this.reel.numRows + 1),
                time: stopTime,
                transition: 'easeOutQuad'
            });

            this.buildMainStripe(this.output.slice());
            this.mainStripe.y = -this.mainStripe.height - this.symbolSize.y;

            const fellPromises: Promise<void>[] = [];
            const fallingCascadeLandAnimationTime: number = 0.03;
            const finalStopTime: number = (this.gameSpeedLevel == 0 && this.fallingCascade) ? ((this.visibleSymbols.length+1) * fallingCascadeLandAnimationTime) : 0.15;
            Tweener.addTween(this.mainStripe, {
                // y: this.gameSpeedLevel == 0 ? -this.symbolSize.y + this.startTiltSize:-this.symbolSize.y,
                y: this.fallingCascade? -this.symbolSize.y:this.gameSpeedLevel == 0 ? -this.symbolSize.y + this.startTiltSize : -this.symbolSize.y + (this.startTiltSize / 3),
                time: stopTime,
                transition: 'easeOutQuad',
                onStart: ()=>{
                    if(this.fallingCascade) {
                        this.visibleSymbols.forEach((symbol, index) => {
                            fellPromises.push(symbol.animateY(-300, 0, this.gameSpeedLevel == 0 ? stopTime : 0.01, (this.gameSpeedLevel == 0 ? (this.visibleSymbols.length - (index + 1)) * fallingCascadeLandAnimationTime : 0)));
                        });
                    }
                }
            });

            Promise.all(fellPromises).then(()=>{
                Tweener.addTween(this.mainStripe, {
                    y: -this.symbolSize.y,
                    time: finalStopTime,
                    transition: 'easeInOutQuad',
                    delay: stopTime,
                    onStart: () => {
                        if (this.spinSound) {
                            this.spinSound.stop();
                            this.spinSound = null;
                        }

                        this.visibleSymbols.forEach((symbol) => {
                            const landSound: SoundData = symbol.animateLanding();
                            if(landSound) {
                                SoundManager.play(landSound);
                            }
                        });

                        if (stopSound) {
                            SoundManager.play(stopSound);
                        }
                    },
                    onComplete: () => {
                        this.anticipationVisibility(0);
                        resolve();
                    }
                });
            })
        });
    }

    public anticipationVisibility(value: number, delay: number = 0, anticipationSound: SoundData = null): void {
        if (!this.anticipationAnimation)
            return;

        Tweener.removeTweens(this.anticipationAnimation);
        Tweener.addTween(this.anticipationAnimation, {
            alpha: value,
            delay: delay,
            time: 0.15,
            transition: 'easeOutSine',
            onStart: () => {
                if (value === 1) {
                    this.anticipationAnimation.gotoAndPlay(0);
                    this.anticipationAnimation.visible = true;
                    this.anticipationSound = SoundManager.play(anticipationSound);
                }
            },
            onComplete: () => {
                if (value === 0) {
                    this.anticipationAnimation.stop();
                    this.anticipationAnimation.visible = false;
                    if (this.anticipationSound)
                        this.anticipationSound.stop();
                }
            }
        })
    }

    public get numRows(): number {
        return this.reel.numRows;
    }

    public getVisibleSymbols(): SymbolView[] {
        return [...this.visibleSymbols];
    }

    public changeSymbolVisiblity(symbolIndex: number, visible: boolean, transitionTime: number = 0): void {
        // this.mainStripe.cacheAsBitmap = false;
        const symbol: DisplayObject = this.visibleSymbols[symbolIndex];

        Tweener.addTween(symbol, {
            alpha: visible ? 1 : 0,
            time: transitionTime,
            onComplete: () => {
                symbol.visible = visible;
            }
        })

        // this.mainStripe.cacheAsBitmap = true;
    }

    public async cascade(symbolDisappearPattern: number[], targetOutput: number[]): Promise<void> {
        this.reset();

        // make symbols disappear
        const destroyedSymbols: SymbolView[] = [];
        for (let i = 0; i < symbolDisappearPattern.length; i++) {
            if (symbolDisappearPattern[i]) {
                const destroyedSymbol: SymbolView = this.visibleSymbols[i];
                this.mainStripe.removeChild(destroyedSymbol);
                destroyedSymbols.push(destroyedSymbol);
            }
        }
        destroyedSymbols.forEach((s: SymbolView) => {
            removeArrayElement(this.visibleSymbols, s);
            this.symbolsPool.release(s);
        });

        // create missing symbols on top
        const numMissingSymbols: number = targetOutput.length - this.visibleSymbols.length;
        for (let i = numMissingSymbols - 1; i >= 0; i--) {
            const symbolX: number = Math.floor(this.symbolSize.x / 2);
            const symbolY: number = (i - numMissingSymbols) * this.symbolSize.y + Math.floor(this.symbolSize.y / 2);

            const symbolData: SymbolData = this.symbols.get(targetOutput[i]);
            const symbolView: SymbolView = this.symbolsPool.get(symbolData.id);
            symbolView.position.set(symbolX, symbolY);
            this.mainStripe.addChildAt(symbolView, 0);
            this.visibleSymbols.unshift(symbolView);
        }

        // drop symbols down
        return new Promise<void>((resolve) => {
            let cascading: boolean = false;
            this.visibleSymbols.forEach((symbol: SymbolView, index: number) => {
                const targetSymbolY: number = (index + 1) * this.symbolSize.y + Math.floor(this.symbolSize.y / 2);
                if (symbol.y != targetSymbolY) {
                    cascading = true;
                    Tweener.addTween(symbol, {
                        y: targetSymbolY,
                        time: this.cascadeTime,
                        transition: 'easeInOutQuad'
                    });
                }
            });

            if (cascading) {
                Tweener.addCaller(this, {
                    count: 1,
                    time: this.cascadeTime,
                    onComplete: () => {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    public reset(): void {
        Tweener.removeTweens(this.mainStripe);
        Tweener.removeTweens(this.spinStripe1);
        Tweener.removeTweens(this.spinStripe2);

        for (const s of this.visibleSymbols) {
            s.off(SymbolViewEvent.WIN_ANIMATION_COMPLETE);
            s.reset();
        }
    }

    public async swapSymbol(symbolInReelId: number, symbol: SymbolView, transitionTime: number = 0, delayTime: number = 0, transitionSound: SoundData = null): Promise<void> {
        const oldSymbol: SymbolView = this.visibleSymbols[symbolInReelId];
        return new Promise((resolve) => {
            this.visibleSymbols[symbolInReelId] = symbol;

            symbol.parent = oldSymbol.parent;
            symbol.originalParentInfo = oldSymbol.originalParentInfo;
            symbol.position = oldSymbol.position;

            symbol.alpha = 0;

            this.mainStripe.addChildAt(symbol, this.mainStripe.getChildIndex(oldSymbol) + 1);

            Tweener.addTween(symbol, {
                alpha: 1,
                time: transitionTime,
                delay: delayTime,
                onStart: () => {
                    if (transitionSound) {
                        SoundManager.play(transitionSound.id);
                    }
                },
                onComplete: () => {
                    oldSymbol.visible = false;
                    this.mainStripe.removeChildAt(this.mainStripe.getChildIndex(oldSymbol));
                    oldSymbol.destroy();

                    resolve();
                }
            });
        })
    }

    // PRIVATE API
    protected onAdded(): void {
        this.buildMainStripe(this.output.slice());
        this.createBackgroundMultipliers(this.multiplierOutput.slice());
        this.mainStripe.y = -this.symbolSize.y;
    }
    protected onRemoved(): void {
        // implement in derived class if needed
    }
    private createBackgroundMultipliers(output: number[]): void {
        this.multiplierSymbols = [];
        output.forEach((multiplierId, index) => {
            const multiplierSymbolView: MultiplierSymbolView = new MultiplierSymbolView(multiplierId % 1000)
            multiplierSymbolView.y = index * this.symbolSize.y;
            this.multiplierSymbols.push(multiplierSymbolView);
            this.multiplierContainer.addChild(multiplierSymbolView);
        })
    }

    public async setMultipliers(output: number[], delay: number = 0): Promise<void> {
        const multiplierPromises: Promise<void>[] = [];
        output.forEach((multiplierId, index) => {
            
            multiplierPromises.push(this.multiplierSymbols[index].setMultiplier(multiplierId % 1000, delay));
        })
        await Promise.all(multiplierPromises);
    }

    public removeAllMultipliers(delay: number = 0): void {
        this.multiplierSymbols.forEach((ms) => { ms.setMultiplier(0, delay) })
    }

    private buildMainStripe(output: number[]): void {
        // this.mainStripe.cacheAsBitmap = false;
        if(!this.fallingCascade) {
            output.push(randomArrayElement(this.reel.availableSymbols));
            output.unshift(randomArrayElement(this.reel.availableSymbols));
        }

        // clear stripe
        this.visibleSymbols = [];
        while (this.mainStripe.children.length) {
            const symbolIcon: SymbolView = this.mainStripe.removeChildAt(0) as SymbolView;
            this.symbolsPool.release(symbolIcon);
        }

        for (let i = 0; i < output.length; i++) {
            const symbolData: SymbolData = this.symbols.get(output[i]);
            const symbolX: number = Math.floor(this.symbolSize.x / 2);
            const symbolY: number = (i + (this.fallingCascade?1:0)) * this.symbolSize.y + Math.floor(this.symbolSize.y / 2);
            if ((i == 0 || i == this.reel.numRows + 1) && !this.fallingCascade) {
                // build additional textures
                const symbolSprite: Sprite = new Sprite(symbolData.staticIcon.texture);
                symbolSprite.pivot.set(Math.floor(symbolSprite.width / 2), Math.floor(symbolSprite.height / 2));
                symbolSprite.position.set(symbolX, symbolY);
                this.mainStripe.addChild(symbolSprite);
            } else {
                // build main SymbolViews
                let symbolView: SymbolView;
                if(symbolData?.specialViewClass) {
                    symbolView = new symbolData.specialViewClass(symbolData);
                } else {
                    symbolView = this.symbolsPool.get(symbolData.id);
                }
                symbolView.position.set(symbolX, symbolY);
                this.mainStripe.addChild(symbolView);
                this.visibleSymbols.push(symbolView);
                const sm:SlotMachine = container.resolve(SlotMachine)
                const symbolMultiplierDescription = sm.description.wildcards.find((multiplierSymbolDesc) => {
                    return multiplierSymbolDesc.symbolId ===symbolView.data.id;
                });
                if (!symbolMultiplierDescription)
                    continue;
            const multiplier = this.createMultiplier(symbolMultiplierDescription.multiplier);
            symbolView.addChild(multiplier);
            }
        }

        // this.mainStripe.cacheAsBitmap = true;
    }
    protected createMultiplier(value) {
        const style = new TextStyle({
            fontFamily: AssetsManager.webFonts.get('InterRegular').family,
            fill:[
                '#FFB200',
                '#FFFF00'
            ],
            fontSize:40,
            lineJoin: 'round',
            stroke: '#FFD911',
            strokeThickness: 4,
            dropShadow:true,
            dropShadowColor: '#000000',
            dropShadowAlpha: 40,
            dropShadowAngle: 0.2,
            dropShadowDistance: 8
        })
        const multiplier = new Text(`${value}x`, style);
        multiplier.name = 'multipliern';
         autoscaleText(multiplier, 40, 150, 65);
        multiplier.anchor.set(0.5, 0.5);
        multiplier.y+=20;
        // multiplier.scale.set(0, 0);
        
        return multiplier;
    }

    private buildSpinStripe(container: Container, stripeLength: number): void {
        // container.cacheAsBitmap = false;
        const symbols: number[] = [];
        while (symbols.length != stripeLength) {
            symbols.push(randomArrayElement(this.reel.availableSymbols));
        }

       for (let i = 0; i < symbols.length; i++) {
            const symbolId: number = symbols[i];
            if (!this.symbols.has(symbolId)) {
                throw new Error(`No SymbolData with id: ${symbolId}`);
            }

            let texture: Texture = this.symbols.get(symbolId).staticIcon.texture;
            const symbolData: SymbolData = this.symbols.get(symbolId);
            if (blur && symbolData.spinIcon) {
                if(symbolData.specialViewClass) {
                    const dummySymbol = new symbolData.specialViewClass(symbolData);
                    texture = dummySymbol.spinIconTexture;
                    dummySymbol.destroy();
                } else {
                    texture = symbolData.spinIcon.texture;
                }
            }
            const symbolSprite: Sprite = container.getChildAt(i) as Sprite;
            symbolSprite.texture = texture;
            symbolSprite.pivot.set(Math.floor(symbolSprite.width / 2), Math.floor(symbolSprite.height / 2));
            symbolSprite.x = Math.floor(this.symbolSize.x / 2);
            symbolSprite.y = i * this.symbolSize.y + Math.floor(this.symbolSize.y / 2);
            // container.addChild(symbolSprite);
        }

        // container.cacheAsBitmap = true;
    }


    private spinBlur(blurStripe: Container, startDelay: number = 0, startPosition: number = null): void {
        this.buildSpinStripe(blurStripe, this.output.length + 2);
        if (startPosition === null) {
            blurStripe.y = -blurStripe.height - this.symbolSize.y;
        } else {
            blurStripe.y = startPosition;
        }
        let trackPosition: boolean = true;
        Tweener.addTween(blurStripe, {
            y: this.symbolSize.y * (this.reel.numRows + 1),
            time: this.blurSpinTime,
            transition: 'linear',
            delay: startDelay,
            onUpdate: () => {
                if (blurStripe.y > -this.symbolSize.y && trackPosition) {
                    trackPosition = false;
                    if (blurStripe == this.spinStripe1) {
                        this.spinBlur(this.spinStripe2, 0, blurStripe.y - this.spinStripe2.height);
                    } else {
                        this.spinBlur(this.spinStripe1, 0, blurStripe.y - this.spinStripe1.height);
                    }
                }
            }
        });
    }
}
