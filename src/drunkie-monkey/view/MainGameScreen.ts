import {DisplayObject, Point, Sprite} from 'pixi.js';
import LayoutBuilder from '../../gamma-engine/core/utils/LayoutBuilder';
import AssetsManager from '../../gamma-engine/core/assets/AssetsManager';
import LayoutElement from '../../gamma-engine/core/view/model/LayoutElement';
import ReelsView from '../../gamma-engine/slots/view/ReelsView';
import {SymbolsList} from './SymbolsList';
import SlotMachine from '../../gamma-engine/slots/model/SlotMachine';
import {SlotMachineEvent} from '../../gamma-engine/slots/model/event/SlotMachineEvent';
import {SlotMachineState} from '../../gamma-engine/slots/model/SlotMachineState';
import ControlEvent from '../../gamma-engine/core/control/event/ControlEvent';
import {SlotGameEvent} from '../../gamma-engine/slots/control/event/SlotGameEvent';
import {ReelsViewEvent} from '../../gamma-engine/slots/view/event/ReelsViewEvent';
import {clusterData, FreespinWin, LineWin, ScatterWin, SpinResult} from '../../gamma-engine/slots/model/RoundResult';
import MainScreenBackground, {BackgroundType} from './MainScreenBackground';
// import TotalWinFrame from '../../gamma-engine/common/view/TotalWinFrame';
import SoundListExtended from '../sound/SoundListExtended';
import {container, inject, injectable} from 'tsyringe';
import MultiFunctionalButton from '../../gamma-engine/common/view/MultiFunctionalButton';
import UIPanelMobileVertical from '../../gamma-engine/common/view/ui/UIPanelMobileVertical';
import AdjustableLayoutContainer from '../../gamma-engine/core/view/AdjustableLayoutContainer';
import ReelsBackground from './ReelsBackground';
import UIPanelDesktop from '../../gamma-engine/common/view/ui/UIPanelDesktop';
import {CascadeHistoryView} from "../../gamma-engine/common/view/ui/CascadeHistoryView";
import Wallet from "../../gamma-engine/slots/model/Wallet";
import {RuleDescription} from "../../gamma-engine/slots/model/SlotMachineDescription";
import {FreeSpinButton} from "../../gamma-engine/common/view/ui/FreeSpinButton";
import GameService from "../services/GameService";
import {UpdateLayoutDescription} from "../../gamma-engine/core/view/UpdateLayoutDescription";
import {MultiplierEvent} from "../model/MultiplierEvent";
import SymbolView from "../../gamma-engine/slots/view/SymbolView";
import Multiplier from "./Multiplier";
import {ReelHeader} from "./ReelHeader";
import {ScreenOrientation} from "../../gamma-engine/core/view/ScreenOrientation";
import { TransactionType } from '../model/TransactionType';
import { BetDetails } from './BetDetails';
import MultiplierFrame from '../../gamma-engine/common/view/MultiplierFrame';
import { Tweener } from '../../gamma-engine/core/tweener/engineTween';
import Logo from '../../gamma-engine/common/view/Logo';
import { GameTransitionAnimation } from './GameTransitionAnimation';
import BonusGameStatusBar from '../../gamma-engine/common/view/ui/BonusGameStatusBar';
import SymbolViewPool from '../../gamma-engine/slots/view/SymbolViewPool';
import Character, { CharacterAnimations } from './Character';

@injectable()
export default class MainGameScreen extends AdjustableLayoutContainer {
    // private totalWinFrameBaseYPositions: {
    //     desktop: number;
    //     mobile: number;
    // }

    private slotMachine: SlotMachine;

    private currentLineWinIndex: number = -1;
    private currentLineWinCycles: number = 0;
    private maxLineWinCycles: number = 2;
    public isFreeSpins = false;
    public bonusGameStatusBarHorizontal: BonusGameStatusBar;
    public bonusGameStatusBarVertical: BonusGameStatusBar;

    // VIEWS
    public background: MainScreenBackground;
    public reels: ReelsView;
    public reelsBackground: ReelsBackground;
    public uiPanelMobileVertical: UIPanelMobileVertical;
    public uiPanelDesktop: UIPanelDesktop;
    public baseGameCharacter: Character;
    public freeGameCharacter: Character;        
    public logo: Logo;
    public gameTransitionAnimation: GameTransitionAnimation;

    private multiplier:Multiplier;
    protected currentMultipliervalue: number = 0;

    private reelHeader: ReelHeader;
    private betDetails: BetDetails
    private symbolsPool: SymbolViewPool;
    constructor(@inject(SlotMachine) slotMachine: SlotMachine) {
        super(AssetsManager.layouts.get('main-screen'));

        this.slotMachine = slotMachine;
        const cappingInfo = new Map<number, number>();
        SymbolsList.forEach(symbol => cappingInfo.set(symbol.id, symbol.poolSize));
        this.symbolsPool = new SymbolViewPool(cappingInfo);

        LayoutBuilder.create(this.layout, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        // this.totalWinFrameBaseYPositions = {
        //     desktop: this.totalWinFrameDesktop.y,
        //     mobile: this.totalWinFrame.y
        // }

        this.slotMachine.on(SlotMachineEvent.STATE_CHANGED, this.onSlotMachineStateChanged, this);
        this.multiplier.on(MultiplierEvent.ON_TOTAL_MULTIPLIER_ANIMATION_END, this.updateTotalMultiplier, this);
        this.multiplier.on(MultiplierEvent.ON_MULTIPLIER_ANIMATION_END, this.updateReelMultiplier, this);
        this.multiplier.on(MultiplierEvent.ON_TOTAL_MULTIPLIER_ANIMATION_END, this.updateReelHeader, this);

        this.on('added', this.onAdded, this);

        this.addChild(new Sprite(AssetsManager.textures.get('black-rect')));


        // // TESTING CODE
        // this.eventMode = 'dynamic';
        // this.cursor = 'pointer';
        // let s: number = 0;
        // this.on('pointerup', () => {
        //     switch (s) {
        //         case 0:
        //             this.btnMultiFunctional.setText('FEATURE BUY',true);
        //             this.btnMultiFunctional.state = MultiFunctionalButtonState.FEATURE_BUY;
        //             break;
        //         case 1:
        //             this.btnMultiFunctional.setText('FREESPINS LEFT: 0',true);
        //             this.btnMultiFunctional.state = MultiFunctionalButtonState.FREESPINS_LEFT;
        //             break;
        //         case 2:
        //             this.btnMultiFunctional.state = MultiFunctionalButtonState.INVISIBLE;
        //             break;
        //     }
        //     s = (s + 1) % 3;
        // });
    }

    // PRIVATE API
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'ReelsBackground':
                instance = new ReelsBackground();
                break;
            case 'ReelsView':
                instance = new ReelsView(le, this.slotMachine.description.reels.regular, this.slotMachine.roundResult.spins[0], SymbolsList, {
                    winFrameAnimation: {
                        spineAssetName: 'win-frame-animation',
                        animationName: 'win'
                    },
                    anticipationTime: 1.5,
                    symbolSize: new Point(160, 105),
                    fallingCascade: true
                }, this.symbolsPool);
                break;
            case 'UIPanelMobileVertical':
                instance = new UIPanelMobileVertical({
                    UIMainConfiguration: {
                        buttonSpinConfig: {
                            useRotationInStartAnimation: true
                        }
                    }
                }, this);
                break;
            case 'UIPanelDesktop':
                instance = new UIPanelDesktop({
                    UIMainConfiguration: {
                        buttonSpinConfig: {
                            useRotationInStartAnimation: true
                        }
                    }
                }, this);
                break;
            case 'MainScreenBackground':
                instance = new MainScreenBackground();
                break;
            case 'Logo':
                instance = new Logo();
                break;
            case 'TotalWinFrame':
                // instance = new TotalWinFrame(le);
                break;
            case 'TotalWinFrameDesktop':
                // instance = new TotalWinFrame(le);
                break;
            case 'MultiFunctionalButton':
                instance = new MultiFunctionalButton(le);
                break;
                
            case 'BaseGameCharacter':
                instance = new Character(AssetsManager.spine.get('character-basegame'));
                break;
            case 'FreeGameCharacter':
                instance = new Character(AssetsManager.spine.get('character-freegame'));
                break;
            case 'Multiplier':
                instance = new Multiplier(this.reels, this.uiPanelDesktop.multiplierFrame);//new Multiplier(le, this.reels,this.uiPanelDesktop.multiplierFrame,this.tfWinUpTo)
                break;
            case 'ReelHeader':
                instance = new ReelHeader(le);
                break;

                case 'BetDetails':
                    instance = new BetDetails(le);
                    break;
            case 'GameTransitionAnimation':
                instance = new GameTransitionAnimation();
                break;
            case 'BonusGameStatusBarHorizontal':
                instance = new BonusGameStatusBar(le);
                break;
            case 'BonusGameStatusBarVertical':
                instance = new BonusGameStatusBar(le);
                break;
    
        }

        return instance;
    }

    protected updateTotalMultiplier(value) {
        const addMultiplier = Number(value);
        if (isNaN(addMultiplier))
            return;
        this.multiplierFrameHelper((multiplier) => {
            multiplier.value =addMultiplier;
            // multiplier.value = this.slotMachine.currentSpinResult.totalWinMultiplier;
        });
    }
    protected updateReelHeader(value) {
        const multiplier = Number(value);
        this.updateReelMultiplier(multiplier)
        const wallet: Wallet = container.resolve(Wallet);
        const sm = container.resolve(SlotMachine);
        setTimeout(()=>{
            this.updateReelMultiplier(0,()=>{
                this.multiplier.currentWinValue = this.multiplier.currentWinValue * multiplier;
                // this.totalWinFrameDesktop.setValue(sm.roundResult.totalWinValue, true);
                // this.totalWinFrame.setValue(sm.roundResult.totalWinValue, true);
                this.reelHeader.setHeader(sm.currentSpinResult.currentTotalWinValue, true); 
            }
            );
        },500)
    }
    protected updateReelMultiplier(value,onComplete?:any) {
        const multiplier = Number(value);
        if(value<=0){
           
                Tweener.addTween(this.reelHeader['tfMultiplierText'], {
                    x: 0,
                    alpha:0,
                    transition: 'easeInSine',
                    time: 0.35,
                    onComplete: () => {
                        this.reelHeader['tfMultiplierText'].visible = false;
                        this.reelHeader['tfMultiplierText'].text ='';
                        this.reelHeader['tfMultiplierText'].x=0;
                        this.reelHeader['tfMultiplierText'].alpha=1;
                        onComplete&&onComplete();
                        // this.reelHeader['tfCurrentWinValue'].x=0
                    }
                });
                let interval=setInterval(()=>{
                    if(this.reelHeader['tfCurrentWinValue'].x<=0)
                        this.reelHeader['tfCurrentWinValue'].x+=4
                    else{
                        clearInterval(interval);
                    }
                },16.66);
            return;
        }
        if (isNaN(multiplier))
            return;
        this.currentMultipliervalue += multiplier;
        Tweener.addTween(this.reelHeader['tfMultiplierText'].scale, {
            x: 1.15,
            y: 1.15,
            transition: 'easeOutSine',
            time: 0.35,
            onComplete: () => {
                Tweener.addTween(this.reelHeader['tfMultiplierText'].scale, {
                    x: 1,
                    y: 1,
                    transition: 'easeOutElastic',
                    time: 0.3
                });
            }
        });
        Tweener.addTween(this.reelHeader['tfMultiplierText'], {
            x: this.reelHeader['tfCurrentWinValue'].width/2.3,
            transition: 'easeOutSine',
            time: 0.25,
            onComplete: () => {
              
            }
        });
        Tweener.addTween(this.reelHeader['tfCurrentWinValue'], {
            x: -this.reelHeader['tfCurrentWinValue'].width/2.3,
            transition: 'easeOutSine',
            time: 0.25,
            onComplete: () => {
              
            } 
        });
        this.reelHeader['tfMultiplierText'].text = `X ${this.currentMultipliervalue}`
        this.reelHeader['tfMultiplierText'].visible = value;
        // this.reelHeader['tfMultiplierText'].x= this.reelHeader['tfCurrentWinValue'].width/2.3;
        // this.reelHeader['tfCurrentWinValue'].x=-this.reelHeader['tfCurrentWinValue'].width/2.3
    
    }

    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        // if(desc.orientation == ScreenOrientation.VERTICAL){
        //     this.reelHeader.scale.set(1.3)



        // }else if(desc.orientation == ScreenOrientation.HORIZONTAL){
        //     this.reelHeader.scale.set(1)
        // }

        let bottomY: number = desc.baseHeight;
        if (desc.currentHeight > desc.baseHeight) {
            bottomY = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
        }
        this.freeGameCharacter.visible = this.isFreeSpins;
        this.baseGameCharacter.visible = !this.isFreeSpins;
    }

    public onSlotMachineStateChanged(currentState: SlotMachineState): void {
        const sm: SlotMachine = this.slotMachine;
        const wallet: Wallet = container.resolve(Wallet);
        const gs: GameService = container.resolve<GameService>('GameService');
        let gameSpeedLevel: number;

        switch (currentState) {
            case SlotMachineState.SPINNING:
                if(sm.previousRoundResult?.nextType === TransactionType.REGULAR)    this.reels.removeMultipliers();
                // this.reelHeader.setHeader(0);

                this.currentLineWinIndex = -1;
                this.currentLineWinCycles = 0;


                this.reels.off(ReelsViewEvent.WIN_ANIMATION_COMPLETE);

                if (sm.previousRoundResult?.complete) {
                    // this.totalWinFrame.setValue(0);
                    // this.totalWinFrameDesktop.setValue(0)
                }
                if (!this.isFreeSpins) {
                    this.uiPanelDesktop.winValue = 0;
                    this.uiPanelMobileVertical.winValue = 0;
                }

                (this.uiPanelDesktop['cascadeHistoryPanel'] as CascadeHistoryView).reset();
                this.uiPanelMobileVertical.cascadeHistoryPanelMobile.reset();

                this.uiPanelMobileVertical.lock();
                this.uiPanelDesktop.lock()

                gameSpeedLevel = sm.stopRequested ? 1 : this.slotMachine.currentGameSpeedLevel;
                this.reels.spin(sm.currentGameSpeedLevel, {
                    id: SoundListExtended.UI_REEL_SPIN,
                    volume: 0.1
                });
                break;
            case SlotMachineState.SPIN_END:
                this.multiplier.symbolArr = []
                this.multiplier.symbolArr.forEach((child:SymbolView):void=>{
                    child.destroy()
                })

            case SlotMachineState.COMMUNICATION_ERROR:
                gameSpeedLevel = sm.stopRequested ? 1 : this.slotMachine.currentGameSpeedLevel;
                const spinResult: SpinResult = sm.currentSpinResult;
                const stopPromises: Promise<void>[] = [
                    this.reels.stop(spinResult.result, {
                        stopSoundData: {
                            id: SoundListExtended.UI_REEL_STOP,
                            volume: 0.2
                        },
                        anticipationSoundData: {
                            id: SoundListExtended.REEL_ANTICIPATION,
                            volume: 0.2
                        },
                    }, gameSpeedLevel, this.getAnticipationReels(spinResult))
                ];
                Promise.all(stopPromises)
                .then(() => {
                    if (sm.currentSpinResult.winValue > 0) {



                    }
                    this.multiplier.once(MultiplierEvent.ON_INITIALIZED_MULTIPLIER_SYMBOLS, () => {
                        if (sm.currentState != SlotMachineState.COMMUNICATION_ERROR) {
                            new ControlEvent(SlotGameEvent.REELS_STOPPED).dispatch();
                        }
                    }, this)
                    this.multiplier.initializeMultiplierSymbols(sm.currentSpinResult.result, true);
                });

                break;
            case SlotMachineState.SPIN_RESULT_MULTI_WIN:
                this.isFreeSpins ? this.freeGameCharacter.setAnimation(CharacterAnimations.FREEGAME.WIN, false) : this.baseGameCharacter.setAnimation(CharacterAnimations.BASEGAME.WIN, false);
                this.showMultiWin();
                const currenttype: TransactionType = this.slotMachine.roundResult.type;
                if (currenttype === TransactionType.FREESPIN || currenttype === TransactionType.RESPIN_IN_FREESPIN) {
                    if (sm.description.reels.regular.cascading) {
                        if (sm.roundResult.spinIndex===sm.roundResult.spins.length-2) {
                            this.uiPanelMobileVertical.winValue = sm.roundResult.totalWinValue;
                            this.uiPanelDesktop.winValue = sm.roundResult.totalWinValue
                        }
                    }
                    return;
                }
                this.uiPanelMobileVertical.winValue = sm.currentSpinResult.currentTotalWinValue;
                this.uiPanelDesktop.winValue = sm.currentSpinResult.currentTotalWinValue

                break;
            case SlotMachineState.SPIN_RESULT_SCATTER:
                this.isFreeSpins ? this.freeGameCharacter.setAnimation(CharacterAnimations.FREEGAME.SCATTER, false) : this.baseGameCharacter.setAnimation(CharacterAnimations.BASEGAME.SCATTER, false);
                this.showScatterWin();
                this.uiPanelDesktop.winValue = this.slotMachine.roundResult.totalWinValue;
                this.uiPanelMobileVertical.winValue = this.slotMachine.roundResult.totalWinValue;
                break;
            case SlotMachineState.SPIN_RESULT_CASCADE:
                this.logo.playWinAnimation('win'); 
                this.reels.multiplierAnimation(sm.previousSpinResult.multipliers).then(() => {
                    this.reels.cascade(sm.multiWinPattern(sm.previousSpinResult), sm.currentSpinResult.result)
                        .then(() => {
                            new ControlEvent(SlotGameEvent.CASCADE_WIN_SHOWN).dispatch();
                            return;
                        });
                })
                break;
            case SlotMachineState.FREE_SPINS_ROUND_START:
                this.baseGameCharacter.visible = false;
                this.freeGameCharacter.visible = true;
                this.freeGameCharacter.setAnimation(CharacterAnimations.FREEGAME.IDLE);

                this.uiPanelMobileVertical.lock();
                this.uiPanelDesktop.lock()
                this.uiPanelMobileVertical.tfHoldSpinButton.visible = false;
                this.uiPanelDesktop.tfHoldDownSpace.visible = false;
                this.isFreeSpins = true;
                this.background.theme = BackgroundType.FREEGAME;
                this.uiPanelDesktop.updateBlurBg(this.lastLayoutDesc);
                this.uiPanelMobileVertical.updateBlurBg(this.lastLayoutDesc);
                break;
            case SlotMachineState.FREE_SPINS:
                this.uiPanelMobileVertical.lock();
                this.uiPanelDesktop.lock()
                this.uiPanelMobileVertical.tfHoldSpinButton.visible = false;
                this.uiPanelDesktop.tfHoldDownSpace.visible = false;
                this.isFreeSpins = true;
                new ControlEvent(SlotGameEvent.FREE_SPIN_START).dispatch();
                break;
            case SlotMachineState.FREE_SPINS_ROUND_END:
                this.baseGameCharacter.visible = true;
                this.freeGameCharacter.visible = false;
                this.baseGameCharacter.setAnimation(CharacterAnimations.BASEGAME.IDLE);

                this.uiPanelMobileVertical.tfHoldSpinButton.visible = true;
                this.uiPanelDesktop.tfHoldDownSpace.visible = true;
                this.background.theme = BackgroundType.NORMAL;
                this.uiPanelDesktop.updateBlurBg(this.lastLayoutDesc);
                this.uiPanelMobileVertical.updateBlurBg(this.lastLayoutDesc);
                // this.isFreeSpins = false;
                break;
            case SlotMachineState.SPIN_RESULT_BONUS_GAME:
                break;

            case SlotMachineState.BONUS_GAME_ROUND_START:
                [this.bonusGameStatusBarHorizontal, this.bonusGameStatusBarVertical].forEach(statusBar => statusBar.showStatusBar());
                [this.uiPanelDesktop, this.uiPanelMobileVertical].forEach(panel => panel.lock(true));
                break;

            case SlotMachineState.BONUS_GAME:
                [this.bonusGameStatusBarHorizontal, this.bonusGameStatusBarVertical].forEach((statusBar) => {
                    statusBar.setRemainingCount(sm.currentSpinResult.bonus.remainingCount);
                    statusBar.setWinValue(sm.currentSpinResult.bonus.winAmount);
                });
                [this.uiPanelDesktop, this.uiPanelMobileVertical].forEach(panel => panel.unlock(true));
                break;

            case SlotMachineState.BONUS_GAME_ROUND_END:
                [this.bonusGameStatusBarHorizontal, this.bonusGameStatusBarVertical].forEach(statusBar => statusBar.hideStatusBar());
                [this.uiPanelDesktop, this.uiPanelMobileVertical].forEach(panel => panel.unlock());
                break;

            case SlotMachineState.IDLE:
                this.background.theme = BackgroundType.NORMAL;
                this.uiPanelMobileVertical.unlock();
                this.uiPanelDesktop.unlock();
                [this.bonusGameStatusBarHorizontal, this.bonusGameStatusBarVertical].forEach((statusBar) => {
                    statusBar.setRemainingCount(0);
                    statusBar.setWinValue(0);
                });
                break;
        }
    }

    private showMultiWin(): void {
        const wallet: Wallet = container.resolve(Wallet);

        this.reels.once(ReelsViewEvent.WIN_ANIMATION_COMPLETE, () => {
            new ControlEvent(SlotGameEvent.MULTI_WIN_SHOWN).dispatch();
        });
        const winningSymbols: Map<number, clusterData[]> = this.slotMachine.currentSpinResult.win.winningPattern;
        this.reels.animateWins(winningSymbols, 1, false);

        winningSymbols.forEach((clusters, symbolId) => {
            clusters.forEach((cluster) => {
                [this.uiPanelMobileVertical.cascadeHistoryPanelMobile, this.uiPanelDesktop['cascadeHistoryPanel'] as CascadeHistoryView].forEach((history) => {
                    history.addCell(
                        symbolId,
                        cluster.symbolCount,
                        wallet.getCurrencyValue(cluster.payout, true),
                        cluster.multiplier
                    )
                })
            })
        })
    }

    private showScatterWin(): void {
        const sm: SlotMachine = this.slotMachine;
        let scatterWin: Map<number, clusterData[]> = sm.currentSpinResult.win?.winningPattern;

        this.reels.once(ReelsViewEvent.WIN_ANIMATION_COMPLETE, () => {
            this.reels.off(ReelsViewEvent.WIN_ANIMATION_COMPLETE);
            new ControlEvent(SlotGameEvent.SCATTER_WIN_SHOWN).dispatch();
        });
        this.reels.animateWins(scatterWin, 1, true);
    }

    private showFreespinsWin(): void {
        const sm: SlotMachine = this.slotMachine;
        const freespinsWin: Map<number, clusterData[]> = sm.currentSpinResult.win?.winningPattern;

        this.reels.once(ReelsViewEvent.WIN_ANIMATION_COMPLETE, () => {
            this.reels.off(ReelsViewEvent.WIN_ANIMATION_COMPLETE);
            new ControlEvent(SlotGameEvent.FREE_SPIN_WIN_SHOWN).dispatch();
        });
        this.reels.animateWins(freespinsWin, 1, false);
    }

    private getWinningSymbols(output:number[][], winPattern: number[][]): Map<number, number>{
        const winingSymbols: Map<number, number> = new Map<number, number>();
        for (let i = 0; i < output.length; i++) {
            for (let j = 0; j < output[i].length; j++) {
                if(winPattern[i][j] == 1){
                    if(winingSymbols.has(output[i][j])){
                        const prevValue: number = winingSymbols.get(output[i][j]);
                        winingSymbols.set(output[i][j], prevValue+1);
                    }
                    else{
                        winingSymbols.set(output[i][j], 1);
                    }
                }
            }
        }

        return winingSymbols;
    }

    private getAnticipationReels(spinResult: SpinResult): number[] {
        // const anticipationReels: number[] = []
        // // 302 free spin scatter - 2 or more
        // let numberOfScatters: number = 0;
        // // check first 4 reels
        // for (let i = 0; i < spinResult.result.length - 1; i++) {
        //     const reelResult: number[] = spinResult.result[i];
        //     numberOfScatters += reelResult.reduce((counter: number, symbolId: number): number => {
        //         if (symbolId == 302) {
        //             return counter + 1;
        //         } else {
        //             return counter;
        //         }
        //     }, 0);
        //     if (numberOfScatters >= 2) {
        //         for (let j = i + 1; j < 5; j++) {
        //             anticipationReels.push(j);
        //         }
        //         break;
        //     }
        // }
        //
        // // 303 bonus - 3 or more
        // numberOfScatters = 0;
        // for (let i = 0; i < spinResult.result.length - 1; i++) {
        //     const reelResult: number[] = spinResult.result[i];
        //     numberOfScatters += reelResult.reduce((counter: number, symbolId: number): number => {
        //         if (symbolId == 303) {
        //             return counter + 1;
        //         } else {
        //             return counter;
        //         }
        //     }, 0);
        //     if (numberOfScatters >= 3) {
        //         for (let j = i + 1; j < 5; j++) {
        //             anticipationReels.push(j);
        //         }
        //         break;
        //     }
        // }
        //
        // return arrayUnique(anticipationReels)
        //     .sort();

        return null;
    }


    private onAdded(): void {
        this.baseGameCharacter.visible = true;
        this.freeGameCharacter.visible = false;
        this.baseGameCharacter.setAnimation(CharacterAnimations.BASEGAME.IDLE);
        
        //Restore previous freespin state
        const nextType: TransactionType = this.slotMachine.roundResult.nextType;
        //Restore previous freespin state
        if (nextType === TransactionType.FREESPIN || nextType === TransactionType.RESPIN_IN_FREESPIN) {
            // this.totalWinFrame.setValue(this.slotMachine.roundResult.totalWinValue);
            // this.totalWinFrameDesktop.setValue(this.slotMachine.roundResult.totalWinValue);
            this.slotMachine.currentState = SlotMachineState.FREE_SPINS_ROUND_START;
            this.uiPanelDesktop.winValue = this.slotMachine.roundResult.totalWinValue;
            this.uiPanelMobileVertical.winValue = this.slotMachine.roundResult.totalWinValue;
            // this.multiplierFrameHelper((multiplierFrame)=>{
            //     multiplierFrame.totalMultiplierValue =  this.slotMachine.currentSpinResult.totalWinMultiplier;
            // });
        }else if (this.slotMachine.currentSpinResult.bonus) {
            this.slotMachine.currentState = SlotMachineState.SPIN_RESULT_BONUS_GAME;
        }
            
        if(nextType === TransactionType.RESPIN){
            new ControlEvent(SlotGameEvent.SPIN_START).dispatch();
        }
    }

    //
    private multiplierFrameHelper(doSomething:(MultiplierFrame)=>void): void{
        [this.uiPanelDesktop.multiplierFrame, this.uiPanelMobileVertical.multiplierFrameMobile].forEach((multiplierFrame: MultiplierFrame)=>{
            doSomething(multiplierFrame);
        });
    }
}
