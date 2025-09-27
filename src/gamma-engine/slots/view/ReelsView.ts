import { Container, Graphics, Point } from 'pixi.js';
import LayoutElement from '../../core/view/model/LayoutElement';
import LayoutBuilder from '../../core/utils/LayoutBuilder';
import ReelView from './ReelView';
import { SpineWinFrameAnimation, SymbolData } from './SymbolData';
import {
    ReelConfiguration,
    ReelDescription,
    ReelSetDescription
} from '../model/SlotMachineDescription';
import ControlEvent from '../../core/control/event/ControlEvent';
import { SlotGameEvent } from '../control/event/SlotGameEvent';
import { ReelsViewEvent } from './event/ReelsViewEvent';
import SymbolView from './SymbolView';
import { SymbolViewEvent } from './event/SymbolViewEvent';
import { removeArrayElement } from '../../core/utils/Utils';
import AssetsManager from '../../core/assets/AssetsManager';
import { SoundData } from '../../core/sound/SoundData';
import { clusterData, SpinResult } from '../model/RoundResult';
import { Tweener } from '../../core/tweener/engineTween';
import { Spine } from 'pixi-spine';
import SymbolViewPool from './SymbolViewPool';

export default class ReelsView extends Container {
    public static defaultReelConfiguration: ReelConfiguration = {
        symbolSize: new Point(212, 212),
        winFrameAnimation: null,
        anticipationTime: 0,
        fallingCascade: false
    }

    private reelViews: ReelView[] = [];
    private reelSetDescription: ReelSetDescription;
    private spinResult: SpinResult
    private symbols: Map<number, SymbolData> = new Map<number, SymbolData>();

    private gameSpeedLevel: number = 0;

    private symbolWinAnimations: SymbolView[] = [];
    private winFrameAnimations: Spine[][] = [];
    protected anticipationDelay: number = 0;
    private symbolsPool: SymbolViewPool;
    protected reelConfiguration: ReelConfiguration;

    // VIEWS
    public reelsContainer: Container;
    public symbolAnimationContainer: Container;
    public symbolAnimationContainerMask: Graphics;
    public winFrameAnimationContainer: Container;

    constructor(le: LayoutElement, reelDescription: ReelSetDescription, spinResult: SpinResult, symbols: SymbolData[], reelConfiguration: ReelConfiguration = ReelsView.defaultReelConfiguration, symbolsPool: SymbolViewPool) {
        super();

        this.reelSetDescription = reelDescription;
        this.spinResult = spinResult;
        this.reelConfiguration = reelConfiguration;

        for (const symbol of symbols) {
            this.symbols.set(symbol.id, symbol);
        }
        this.symbolsPool = symbolsPool;
        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        if (this.symbolAnimationContainerMask) {
            this.symbolAnimationContainer.mask = this.symbolAnimationContainerMask;
        }

        const winFrameAnimation= this.reelConfiguration.winFrameAnimation;
        if(winFrameAnimation) {
            for (let i = 0; i < this.reelViews.length; i++) {
                const rv: ReelView = this.reelViews[i];
                this.winFrameAnimations.push([]);
                for (let j = 0; j < rv.numRows; j++) {
                    const winFrameSpine: Spine = new Spine(AssetsManager.spine.get(winFrameAnimation.spineAssetName));
                    
                    winFrameSpine.visible = false;
                    this.winFrameAnimations[i].push(winFrameSpine);
                    this.winFrameAnimationContainer.addChild(winFrameSpine);
                }
            }
        }

        // // TESTING CODE
        // this.eventMode = 'dynamic';
        // this.cursor = 'pointer';
        // let s: boolean = true;
        // this.on('pointerup', () => {
        //     if (s) {
        //         this.spin();
        //     } else {
        //         this.stop([
        //             [randomArrayElement(this.reelSetDescription.reels[0].availableSymbols), randomArrayElement(this.reelSetDescription.reels[0].availableSymbols), randomArrayElement(this.reelSetDescription.reels[0].availableSymbols)],
        //             [randomArrayElement(this.reelSetDescription.reels[1].availableSymbols), randomArrayElement(this.reelSetDescription.reels[1].availableSymbols), randomArrayElement(this.reelSetDescription.reels[1].availableSymbols)],
        //             [randomArrayElement(this.reelSetDescription.reels[2].availableSymbols), randomArrayElement(this.reelSetDescription.reels[2].availableSymbols), randomArrayElement(this.reelSetDescription.reels[2].availableSymbols)],
        //             [randomArrayElement(this.reelSetDescription.reels[3].availableSymbols), randomArrayElement(this.reelSetDescription.reels[3].availableSymbols), randomArrayElement(this.reelSetDescription.reels[3].availableSymbols)],
        //             [randomArrayElement(this.reelSetDescription.reels[4].availableSymbols), randomArrayElement(this.reelSetDescription.reels[4].availableSymbols), randomArrayElement(this.reelSetDescription.reels[4].availableSymbols)],
        //         ]);
        //     }
        //     s = !s;
        // });
        this.on('added', this.onAdded, this);
    }
    private onAdded() {
        // this.animation.state.setEmptyAnimations(0);
        // this.animation.state.setAnimation(0, 'idle', true)
        this.eventMode = 'dynamic';
        this.on('pointerdown', () => new ControlEvent(SlotGameEvent.STOP_REQUESTED).dispatch());
    }
    // PUBLIC API
    public spin(gameSpeedLevel: number, soundData: SoundData): void {
        this.reset();

        this.gameSpeedLevel = gameSpeedLevel;


        this.reelViews.forEach((reelView, index)=>{
            reelView.spin(this.gameSpeedLevel, (this.reelConfiguration.fallingCascade&& this.gameSpeedLevel==0)?(0.1*index):0, soundData);
        })

        new ControlEvent(SlotGameEvent.REELS_STARTED).dispatch();

        if (this.gameSpeedLevel == 0) {
            Tweener.addCaller(this, {
                count: 1,
                time: 1,
                onComplete: () => {
                    if (this.gameSpeedLevel == 0)
                        new ControlEvent(SlotGameEvent.SPIN_TIME_LAPSED).dispatch();
                }
            });
        } else {
            new ControlEvent(SlotGameEvent.SPIN_TIME_LAPSED).dispatch();
        }
    }

    public async stop(output: number[][],
                      sounds: {
                          stopSoundData: SoundData,
                          anticipationSoundData: SoundData
                      },
                      gameSpeedLevel: number = -1,
                      anticipationReelIds: number[] = null
    ): Promise<void> {
        if (gameSpeedLevel != -1) {
            this.gameSpeedLevel = gameSpeedLevel;
        }

        this.anticipationDelay = 0;

        const stopPromises: Promise<void>[] = [];
        for (let i = 0; i < output.length; i++) {
            const triggerAnticipation: boolean = (anticipationReelIds && anticipationReelIds.length > 0 && anticipationReelIds.includes(i));
            stopPromises.push(this.stopReel(i, output[i], sounds, triggerAnticipation));
        }
        await Promise.all(stopPromises);
    }

    public animateWins(winningSymbols: Map<number, clusterData[]>, times: number = 1, visibleOnComplete: boolean = true): void {
        winningSymbols.forEach((winningSymbol) => {
            winningSymbol.forEach((cluster) => {
                
                const symbolPattern: number[][] = cluster.pattern;
                const winningSymbolsPos: Point[] = [];
                for (let i = 0; i < symbolPattern.length; i++) {
                    const reelView: ReelView = this.reelViews[i];
                    const reelPattern: number[] = symbolPattern[i];
                    const visibleSymbols: SymbolView[] = reelView.getVisibleSymbols();
                    for (let j = 0; j < reelPattern.length; j++) {
                        if (reelPattern[j]) {
                            
                            const symbol: SymbolView = visibleSymbols[j];
                            this.symbolWinAnimations.push(symbol);
                            winningSymbolsPos.push(symbol.getGlobalPosition());
        
                            // Select proper symbol to attach symbol on.
                            let symbolNewParent: Container = this.symbolAnimationContainer;
        
                            symbol.reattachTo(symbolNewParent);
        
                            symbol.once(SymbolViewEvent.WIN_ANIMATION_COMPLETE, () => {
                                // symbol.setStaticIconVisibility(visibleOnComplete);
                                symbol.reset();
                                this.resetWinFrameSpine(i, j);
                                removeArrayElement(this.symbolWinAnimations, symbol);
                                if (!this.symbolWinAnimations.length) {
                                    this.emit(ReelsViewEvent.WIN_ANIMATION_COMPLETE);
                                }
                            });
                            symbol.animateWin(times);
        
                            if(!symbol.isWinFrameEnabled())
                                continue;
        
                            // show win frame if any
                            if (this.winFrameAnimations.length && symbol.data.id !== 25) {
                                const winFrameAnimation: Spine = this.winFrameAnimations[i][j];
                                winFrameAnimation.visible = true;
                                winFrameAnimation.position.set(symbol.x, symbol.y);
                                winFrameAnimation.state.setAnimation(0, this.reelConfiguration.winFrameAnimation.animationName, true);
                            }
                        }
                    }
                }
            })
        })
    }

    public async cascade(symbolDisappearPattern: number[][], targetOutput: number[][]): Promise<void> {
        const cascadePromises: Promise<void>[] = [];
        for (let i = 0; i < symbolDisappearPattern.length; i++) {
            cascadePromises.push(this.reelViews[i].cascade(symbolDisappearPattern[i], targetOutput[i]));
        }
        await Promise.all(cascadePromises);
    }

    public async multiplierAnimation (multiplierTargetOutput: number[][]): Promise<void> {
        const multiplierPromises: Promise<void>[] = [];
        for (let i = 0; i < multiplierTargetOutput.length; i++) {
            multiplierPromises.push(this.reelViews[i].setMultipliers(multiplierTargetOutput[i]));
        }
        await Promise.all(multiplierPromises);

    }

    public reset(): void {
        for (const symbol of this.symbolWinAnimations) {
            symbol.off(SymbolViewEvent.WIN_ANIMATION_COMPLETE);
            symbol.reset();
        }
        this.symbolWinAnimations = [];

        if (this.winFrameAnimations.length) {
            for (let i = 0; i < this.reelViews.length; i++) {
                const rv: ReelView = this.reelViews[i];
                for (let j = 0; j < rv.numRows; j++) {
                    this.resetWinFrameSpine(i, j);
                }
            }
        }
    }

    public getReelViews(): ReelView[] {
        return [...this.reelViews];
    }

    // PRIVATE API
    protected customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'ReelView':
                const reelDescription: ReelDescription = this.reelSetDescription.reels[this.reelViews.length];
                const spinResult: number[] = this.spinResult.result[this.reelViews.length]
                const multiplierResult: number[] = this.spinResult.multipliers[this.reelViews.length]
                instance = new ReelView(le,reelDescription, spinResult, multiplierResult, this.symbols, this.reelConfiguration.symbolSize, this.reelConfiguration.fallingCascade, this.symbolsPool);
                this.reelViews.push(instance as ReelView);
                break;
        }

        return instance;
    }

    protected async stopReel(index: number, output: number[], sounds: {
        stopSoundData: SoundData,
        anticipationSoundData: SoundData
    }, anticipation: boolean): Promise<void> {
        return new Promise((resolve) => {
            const rv: ReelView = this.reelViews[index];
            let stopDelay: number = (this.reelConfiguration.fallingCascade && this.gameSpeedLevel == 0) ? index * 0.12: 0;

            if (anticipation && this.gameSpeedLevel === 0) {
                rv.anticipationVisibility(1, stopDelay + this.anticipationDelay, sounds.anticipationSoundData);
                this.anticipationDelay += (stopDelay + this.reelConfiguration.anticipationTime);
            }

            stopDelay += this.anticipationDelay;
            Tweener.addTween(rv, {
                time: stopDelay,
                onComplete: () => {
                    rv.stop(output, sounds.stopSoundData)
                      .then(() => {
                          resolve();
                      });
                }
            });
        })
    }

    public removeMultipliers(): void {
        this.reelViews.forEach((rv) => {
            rv.removeAllMultipliers(this.gameSpeedLevel === 0 ? 1 : 0.2);
        })
    }

    protected resetWinFrameSpine(indexX: number, indexY: number): void {
        if (!this.winFrameAnimations || this.winFrameAnimations.length === 0)
            return;

        const winFrameAnimation: Spine = this.winFrameAnimations[indexX][indexY];
        winFrameAnimation.state.setEmptyAnimations(0);
        winFrameAnimation.state.clearListeners();
        winFrameAnimation.visible = false;
    }
}
