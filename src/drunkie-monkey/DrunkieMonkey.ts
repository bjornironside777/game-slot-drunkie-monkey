import 'reflect-metadata'; // required by tsyringe
import {ResizeMethod} from '../gamma-engine/core/view/ResizeMethod';
import AssetsConfigLoader from '../gamma-engine/core/load/AssetsConfigLoader';
import Logger from '../gamma-engine/core/utils/Logger';
import {LoadingScreen} from '../gamma-engine/common/view/LoadingScreen';
import {DisplayObject, Rectangle, Text, utils} from 'pixi.js';
import ISwapViewsEffect from '../gamma-engine/core/view/effect/ISwapViewsEffect';
import SwapViewsEffectFadeToBlack from '../gamma-engine/core/view/effect/SwapViewsEffectFadeToBlack';
import MainGameScreen from './view/MainGameScreen';
import ControlEvent from '../gamma-engine/core/control/event/ControlEvent';
import {ApplicationEvent} from '../gamma-engine/core/control/event/ApplicationEvent';
import {BrowserApplication} from '../gamma-engine/core/view/BrowserApplication';
import {SlotMachineEvent} from '../gamma-engine/slots/model/event/SlotMachineEvent';
import {SlotMachineState} from '../gamma-engine/slots/model/SlotMachineState';
import PopupManager from '../gamma-engine/slots/view/popup/PopupManager';
import {WalletEvent} from '../gamma-engine/slots/model/event/WalletEvent';
import PopupNotEnoughBalance from '../gamma-engine/common/view/popup/PopupNotEnoughBalance';
import PopupBigWin from '../gamma-engine/common/view/popup/PopupBigWin';
import SlotMachine from '../gamma-engine/slots/model/SlotMachine';
import {SlotGameEvent} from '../gamma-engine/slots/control/event/SlotGameEvent';
import DummyGameService from './services/DummyGameService';
import IAdjustableLayout from '../gamma-engine/core/view/IAdjustableLayout';
import GraphicUtils from '../gamma-engine/slots/utils/GraphicUtils';
import { SymbolsList} from './view/SymbolsList';
import {container} from 'tsyringe';
import IGameService from '../gamma-engine/slots/service/IGameService';
import SlotGameFrontController from '../gamma-engine/slots/control/SlotGameFrontController';
import Wallet from '../gamma-engine/slots/model/Wallet';
import SoundListExtended from './sound/SoundListExtended';
import PopupConnectionLost from '../gamma-engine/common/view/popup/PopupConnectionLost';
import {UIPanelEvent} from '../gamma-engine/common/control/event/UIPanelEvent';
import OpenPanelCommand from '../gamma-engine/common/control/command/OpenPanelCommand';
import HistoryPanel from '../gamma-engine/common/view/ui/HistoryPanel';
import ClosePanelCommand from '../gamma-engine/common/control/command/ClosePanelCommand';
import History from '../gamma-engine/common/model/History';
import CompleteRoundCommand from '../gamma-engine/slots/control/command/CompleteRoundCommand';
import CompleteRoundCommandOverride from './control/command/CompleteRoundCommandOverride';
// import AdjustBetPanel from '../gamma-engine/common/view/ui/AdjustBetPanel';
import ChangeUISettingsStateCommand from '../gamma-engine/common/control/command/ChangeUISettingsStateCommand';
import {UIStateEvent} from '../gamma-engine/common/model/event/UIStateEvent';
import PaytablePanelMobile from '../gamma-engine/common/view/ui/PaytablePanelMobile';
import UIState, {UIPanelType} from '../gamma-engine/common/model/UIState';
import Panel from '../gamma-engine/common/view/ui/Panel';
import PopupFeatureBuy from '../gamma-engine/common/view/popup/PopupFeatureBuy';
import PopupState, {PopupData, PopupType} from '../gamma-engine/common/model/PopupState';
import ShowPopupCommand from '../gamma-engine/common/control/command/ShowPopupCommand';
import HidePopupCommand from '../gamma-engine/common/control/command/HidePopupCommand';
import PopupFreespins from '../gamma-engine/common/view/popup/PopupFreespins';
import {AutospinOption} from '../gamma-engine/common/model/AutospinOption';
import IntroScreen from './view/IntroScreen';
import {IntroScreenEvent} from '../gamma-engine/common/view/event/IntroScreenEvent';
import AssetsManager from '../gamma-engine/core/assets/AssetsManager';
import {UpdateLayoutDescription} from '../gamma-engine/core/view/UpdateLayoutDescription';
import MobileBrowserLog from '../gamma-engine/core/utils/MobileBrowserLog';
import SoundManager from '../gamma-engine/core/sound/SoundManager';
import PaytablePanelDesktop from '../gamma-engine/common/view/ui/PaytablePanelDesktop';
import {ScreenOrientation} from '../gamma-engine/core/view/ScreenOrientation';
// import SystemSettingsPanel from "../gamma-engine/common/view/ui/SystemSettingsPanel";
// import SystemSettingsPanelMobile from "../gamma-engine/common/view/ui/SystemSettingsPanelMobile";
import AdjustBetQuantityCommand from "./control/command/AdjustBetQuantityCommand";
import {UIEventExtension} from "./control/event/UIEventExtension";
import SpinStartCommandOverride from "./control/command/SpinStartCommandOverride";
import SpinStartCommand from "../gamma-engine/slots/control/command/SpinStartCommand";
import {AdjustTotalBetCommand} from "./control/command/AdjustTotalBetCommand";
import GameService from "./services/GameService";
import {SymbolData} from "../gamma-engine/slots/view/SymbolData";
import {SlotGameEventExtension} from "./control/event/SlotGameEventExtension";
import {getFromLocalStorage} from "./model/LocalStorageUtils";
import BuyFeatureCommandOverride from "./control/command/BuyFeatureCommandOverride";
// import Translation from '../gamma-engine/core/translations/Translation';
import { Tweener } from '../gamma-engine/core/tweener/engineTween';
import AutospinPanelMobile from '../gamma-engine/common/view/ui/AutospinPanelMobile';
import AutospinPanelDesktop from '../gamma-engine/common/view/ui/AutospinPanelDesktop';
import PopupBonusspinsIntro from '../gamma-engine/common/view/popup/PopupBonusspinsIntro';
import PopupBonusspinsOutro from '../gamma-engine/common/view/popup/PopupBonusspinsOutro';
import { calculateDaysAndHours } from '../gamma-engine/core/utils/Utils';
import AdjustBetPanelVertical from '../gamma-engine/common/view/ui/AdjustBetPanelVertical';
import AdjustBetPanelHorizontal from '../gamma-engine/common/view/ui/AdjustBetPanelHorizontal';
import SystemSettingsPanelVertical from '../gamma-engine/common/view/ui/SystemSettingsPanelVertical';
import SystemSettingsPanelHorizontal from '../gamma-engine/common/view/ui/SystemSettingsPanelHorizontal';

declare let VERSION: string;

export class DrunkieMonkey extends BrowserApplication {
    private frontController: SlotGameFrontController;
    private gameService: IGameService;
    private language: string = 'EN';
    private _activeMainGameView: DisplayObject & IAdjustableLayout;
    private slotMachine: SlotMachine;
    private wallet: Wallet

    private currentWidth: number = 0;
    private currentHeight: number = 0;

    private assetsBaseUrl: string = '/assets';

    // VIEWS
    private loadingScreen: LoadingScreen;
    private introScreen: IntroScreen;
    private mainGameScreen: MainGameScreen;

    private popupManager: PopupManager;
    private popupDesktop: Panel;
    private popupVertical: Panel;

    // PANELS
    private historyPanelVertical: HistoryPanel;
    private historyPanelHorizontal: HistoryPanel;
    private autospinPanelVertical: AutospinPanelMobile;
    private autospinPanelHorizontal: AutospinPanelDesktop;
    private adjustBetPanelVertical: AdjustBetPanelVertical;
    private adjustBetPanelHorizontal: AdjustBetPanelHorizontal;
    private paytablePanelVertical: PaytablePanelMobile;
    private paytablePanelHorizontal: PaytablePanelDesktop;
    private systemSettingsPanelVertical: SystemSettingsPanelVertical;
    private systemSettingsPanelHorizontal: SystemSettingsPanelHorizontal;
    private popupBalanceVertical: PopupNotEnoughBalance;
    private popupBalanceHorizontal: PopupNotEnoughBalance;
    private popupConnectionLostVertical: PopupConnectionLost;
    private popupConnectionLostHorizontal: PopupConnectionLost;
    private popupFeatureBuyVertical: PopupFeatureBuy;
    private popupFeatureBuyHorizontal: PopupFeatureBuy;
    private popupBigWinVertical: PopupBigWin;
    private popupBigWinHorizontal: PopupBigWin;
    private popupFreespinsVertical: PopupFreespins;
    private popupFreespinsHorizontal: PopupFreespins;
    private popupBonusspinsIntroHorizontal: PopupBonusspinsIntro;
    private popupBonusspinsIntroVertical: PopupBonusspinsIntro;
    private popupBonusspinsOutroHorizontal: PopupBonusspinsOutro;
    private popupBonusspinsOutroVertical: PopupBonusspinsOutro;

    constructor(gameContainer: HTMLDivElement, config: {
        debug?: true,
        mobileLog?: true,
        logLevel: number,
        assetsBaseUrl?: string,
        lobbyUrl?: string,
        startingBalance?: number,
        serverApiUrl: string,
        historyApiUrl: string,
        jwtToken: string,
        gameCode: string,
        language: string
    }) {
        if (config.mobileLog && utils.isMobile.any) {
            new MobileBrowserLog();
        }

        if (utils.isMobile.any) {
            
        }

        Logger.info(`Gammastack - Drunkie Monkey [${VERSION}]`);

        Logger.logLevel = config.logLevel;

        super(gameContainer, {
            id: 'game',
            container: gameContainer,
            resizeMethod: ResizeMethod.SHOW_ALL,
            backgroundColor: 0x000000,
            baseWidth: 1920,
            baseHeight: 1080,
            autoUpdateSizeToOrientation: true,
            debug: config.debug,
            fps: ((getFromLocalStorage('settings')?.batterySaver ?? false) == true)?20:60
        });
        // disable right click on div
        gameContainer.addEventListener('contextmenu', (e) => e.preventDefault());

        Logger.warning(`FPS VALUE - ${((getFromLocalStorage('settings')?.batterySaver ?? false) == true)?20:60}`);

        // PixiJS Chrome extension support
        // globalThis.__PIXI_APP__ = this.pixi;
        
        // This ensures removeEventListener only runs with valid function references
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        EventTarget.prototype.removeEventListener = function (type, listener, options) {
            if (typeof listener !== 'function') {
                console.warn(`Invalid listener detected for removeEventListener:`, listener);
                return;
            }
            originalRemoveEventListener.call(this, type, listener, options);
        };

        function handleVisibilityChange() {
            const { ctx } = Howler;
            if (document.visibilityState !== "hidden") {
                setTimeout(() => {
                    ctx?.resume();
                    Howler.mute(false);
                }, 100);
            } else {
                Howler.autoSuspend = false;
                Howler.mute(true);
            }
        }
        
       
        document.addEventListener('visibilitychange', handleVisibilityChange);
        this.gameService = new GameService(config.serverApiUrl, config.jwtToken, config.gameCode,config.lobbyUrl ?? '');/*new DummyGameService(
            config.lobbyUrl ?? '',
            config.startingBalance ?? 0
        );*/
        container.registerInstance<IGameService>('GameService', this.gameService);

        this.frontController = new SlotGameFrontController();
        this.frontController.addCommand(UIPanelEvent.OPEN_SETTINGS, ChangeUISettingsStateCommand)
        this.frontController.addCommand(UIPanelEvent.CLOSE_SETTINGS, ChangeUISettingsStateCommand)
        this.frontController.addCommand(UIPanelEvent.OPEN_PANEL, OpenPanelCommand);
        this.frontController.addCommand(UIPanelEvent.CLOSE_PANEL, ClosePanelCommand);
        this.frontController.removeCommand(SlotGameEvent.ROUND_COMPLETE, CompleteRoundCommand);
        this.frontController.addCommand(SlotGameEvent.ROUND_COMPLETE, CompleteRoundCommandOverride);
        this.frontController.addCommand(UIPanelEvent.SHOW_POPUP, ShowPopupCommand);
        this.frontController.addCommand(UIPanelEvent.HIDE_POPUP, HidePopupCommand);

        this.frontController.addCommand(UIEventExtension.BET_QUANTITY_UP, AdjustBetQuantityCommand);
        this.frontController.addCommand(UIEventExtension.BET_QUANTITY_DOWN, AdjustBetQuantityCommand);
        this.frontController.addCommand(UIEventExtension.BET_QUANTITY_MAX, AdjustBetQuantityCommand);

        this.frontController.addCommand(UIEventExtension.TOTAL_BET_DOWN, AdjustTotalBetCommand);
        this.frontController.addCommand(UIEventExtension.TOTAL_BET_UP, AdjustTotalBetCommand);

        this.frontController.removeCommand(SlotGameEvent.SPIN_START, SpinStartCommand);
        this.frontController.addCommand(SlotGameEvent.SPIN_START, SpinStartCommandOverride);

        this.frontController.addCommand(SlotGameEventExtension.BUY_FREESPINS, BuyFeatureCommandOverride);

        container.registerSingleton(UIState);
        container.registerSingleton(PopupState);
        container.registerSingleton(History);

        this.popupManager = new PopupManager();
        this.popupManager.position.set(this.baseWidth / 2, this.baseHeight / 2);
        this.stage.addChild(this.popupManager);

        if(config.language) 
            this.language = config.language;

        if (config.assetsBaseUrl)
            this.assetsBaseUrl = config.assetsBaseUrl + this.assetsBaseUrl;

        const loadingScreenAssetsLoader: AssetsConfigLoader = new AssetsConfigLoader(`${this.assetsBaseUrl}/loading-screen-assets-config.json`,config.language, this.pixi.renderer);
        loadingScreenAssetsLoader.on(AssetsConfigLoader.EVENT_LOADING_COMPLETE, this.onLoadingScreenAssetsLoaded, this);

        SoundManager.getChannel('default').mute = !(getFromLocalStorage('settings')?.soundFx ?? true);
        SoundManager.getChannel('ambient').mute = !(getFromLocalStorage('settings')?.ambientMusic ?? true);

        loadingScreenAssetsLoader.load();
}

    public set activeMainGameView(value: DisplayObject & IAdjustableLayout) {
        if (this._activeMainGameView == value) {
            return;
        }

        const oldView: DisplayObject = this._activeMainGameView;
        this._activeMainGameView = value;
        this.onWindowResize();
        //
        // const w: number = Math.ceil(this.width);
        // const h: number = Math.ceil(this.height);
        const w: number = 4000;
        const h: number = 4000;
        const x: number = -(w - this.baseWidth) / 2;
        const y: number = -(h - this.baseHeight) / 2;
        const fadeSize: Rectangle = new Rectangle(x, y, w, h);

        if (oldView) {
            const swapEffect: ISwapViewsEffect = new SwapViewsEffectFadeToBlack(fadeSize);
            // let swapEffect: ISwapViewsEffect = new SwapViewsEffectFadeOut();
            swapEffect.apply(oldView, this._activeMainGameView, this.stage, () => {
                if (oldView == this.loadingScreen) {
                    oldView.destroy({
                        children: true
                    });
                }
            });
        } else {
            this.stage.addChildAt(this._activeMainGameView, 0);
        }
    }

    private onLoadingScreenAssetsLoaded(): void {
        Logger.info('Loading screen assets loaded');

        this.loadingScreen = new LoadingScreen();
        this.activeMainGameView = this.loadingScreen;

        const gameAssetsLoader: AssetsConfigLoader = new AssetsConfigLoader(
            `${this.assetsBaseUrl}/main-game-assets-config.json`,
            this.language,
            this.pixi.renderer
        );
        gameAssetsLoader.on(AssetsConfigLoader.EVENT_LOADING_PROGRESS, (progress: number) => {
            this.loadingScreen.setProgress(progress);
        }, this);
        gameAssetsLoader.on(AssetsConfigLoader.EVENT_LOADING_COMPLETE, this.onGameAssetsLoaded, this);
        gameAssetsLoader.load();

        new ControlEvent(ApplicationEvent.INIT).dispatch();
    }

    private onGameAssetsLoaded(): void {
        Logger.info('Game assets loaded');
        GraphicUtils.init(this.pixi.renderer);
        GraphicUtils.processSymbolsData(SymbolsList);

        if ((getFromLocalStorage('settings')?.introScreen ?? true) == false) {
            this.onAllAssetsLoaded();
            return;
        }

        this.introScreen = new IntroScreen();
        this.introScreen.on(IntroScreenEvent.ON_GET_STARTED_CLICKED, this.onAllAssetsLoaded, this);
        this.activeMainGameView = this.introScreen
    }

    private onAllAssetsLoaded(): void {
        // check config complete
        if (!container.isRegistered(SlotMachine)) {
            Tweener.addCaller(this, {
                count: 1,
                time: 0.1,
                onComplete: () => {
                    this.onAllAssetsLoaded();
                }
            });
            return;
        }

        this.slotMachine = container.resolve(SlotMachine);
        this.slotMachine.on(SlotMachineEvent.STATE_CHANGED, this.onSlotMachineStateChanged, this);

        const uiState = container.resolve(UIState);
        uiState.on(UIStateEvent.ACTIVE_PANEL_CHANGED, this.onUiActivePanelChanged, this);

        const popupState: PopupState = container.resolve(PopupState)
        popupState.on(UIStateEvent.ACTIVE_POPUP_CHANGED, this.onActivePopupChanged, this);

        this.wallet = container.resolve(Wallet)

        // TODO: uncomment these and remove the bottom line for feature presentation screen
        // this.featurePresentationScreen = new FeaturePresentationScreen();
        // this.featurePresentationScreen.on('continue', this.onFeaturePresentationScreenContinue, this);
        // this.activeMainGameView = this.featurePresentationScreen;

        new ControlEvent(ApplicationEvent.LOADING_COMPLETE).dispatch();
    }

    private onFeaturePresentationScreenContinue(): void {
        new ControlEvent(ApplicationEvent.LOADING_COMPLETE).dispatch();
    }

    private onSlotMachineStateChanged(currentState: SlotMachineState, previousState: SlotMachineState): void {

        switch (currentState) {
            case SlotMachineState.IDLE:

                if (!this.mainGameScreen) {
                    this.mainGameScreen = container.resolve(MainGameScreen);
                    container.resolve(Wallet)
                             .on(WalletEvent.NOT_ENOUGH_BALANCE, this.onNotEnoughBalance, this);
                }
                this.activeMainGameView = this.mainGameScreen;

                // // TEST CODE ONLY
                // this.popupManager.show(
                //     new PopupBigWin(1, 10000, new Text('', {
                //         fontFamily: AssetsManager.webFonts.get('InterRegular').family,
                //         fill: [
                //             0xffc300
                //         ],
                //         fontSize: 80,
                //         lineJoin: 'round',
                //
                //     })),
                //     new PopupBigWin(1, 10000, new Text('', {
                //         fontFamily: AssetsManager.webFonts.get('InterRegular').family,
                //         fill: [
                //             0xffc300
                //         ],
                //         fontSize: 80,
                //         lineJoin: 'round',
                //     }))
                //     ,-1,
                //     false,
                //     {},
                //     PopupManager.defaultAnimationConfiguration,
                //     {}
                // );

                // this.popupManager.show(
                //     new PopupFreespins(10),
                //     new PopupFreespins(10),
                //     -1,
                //     false,
                //     {},
                //     PopupManager.jumpAnimationConfiguration,
                //     {}
                // );

                // this.popupManager.show(
                //     new PopupFeatureBuy(),
                //     -1,
                //     false,
                //     {},
                //     PopupManager.jumpAnimationConfiguration,
                //     {}
                // );

                break;
            case SlotMachineState.BIG_WIN:
                this.popupBigWinHorizontal?.['updateLayout']?.(this.updateLayoutDescription);
                this.popupBigWinVertical?.['updateLayout']?.(this.updateLayoutDescription);

                const BigWinData: PopupData = {
                    type: PopupType.BIG_WIN,
                    hideOnClick: true,
                    duration: 4.5,
                    callbacks: {
                        onPopupHidden: () => {
                            new ControlEvent(SlotGameEvent.BIG_WIN_SHOWN).dispatch();
                        }
                    },
                    animationConfig: ()=> PopupManager.jumpAnimationConfiguration,
                    showSound:  this.getProperWinSound(this.slotMachine.bigWinLevel(this.slotMachine.roundResult)),
                    clickOnPanelToClose: true
                }
                new ControlEvent(UIPanelEvent.SHOW_POPUP, BigWinData).dispatch();
                break;
            case SlotMachineState.FREE_SPINS_ROUND_START:
                this.popupFreespinsVertical?.['updateLayout']?.(this.updateLayoutDescription);
                this.popupFreespinsHorizontal?.['updateLayout']?.(this.updateLayoutDescription);

                const FreeSpinStartData: PopupData = {
                    type: PopupType.FREE_SPIN_INTRO,
                    hideOnClick: true,
                    duration: -1,
                    callbacks: {
                        onPopupHidden: () => {
                            this.mainGameScreen.gameTransitionAnimation.setTransition('transition').then(() => { new ControlEvent(SlotGameEvent.FREE_SPIN_ROUND_STARTED).dispatch() });
                            this.mainGameScreen.uiPanelDesktop.updateBlurBg(this.updateLayoutDescription);
                            this.mainGameScreen.uiPanelMobileVertical.updateBlurBg(this.updateLayoutDescription);
                        }
                    },
                    animationConfig: ()=> PopupManager.jumpAnimationConfiguration,
                    clickOnPanelToClose: true
                }
                new ControlEvent(UIPanelEvent.SHOW_POPUP, FreeSpinStartData).dispatch();
                break;
            case SlotMachineState.FREE_SPINS_ROUND_END:
                this.popupFreespinsVertical?.['updateLayout']?.(this.updateLayoutDescription);
                this.popupFreespinsHorizontal?.['updateLayout']?.(this.updateLayoutDescription);
                
                const Data: PopupData = {
                    type: PopupType.FREE_SPIN_OUTRO,
                    hideOnClick: true,
                    duration: -1,
                    callbacks: {
                        onPopupHidden: () => {
                            this.mainGameScreen.gameTransitionAnimation.setTransition('transition').then(() => { new ControlEvent(SlotGameEvent.FREE_SPIN_ROUND_COMPLETE).dispatch() });
                            this.mainGameScreen.uiPanelDesktop.updateBlurBg(this.updateLayoutDescription);
                            this.mainGameScreen.uiPanelMobileVertical.updateBlurBg(this.updateLayoutDescription);
                            this.mainGameScreen.isFreeSpins = false;
                        }
                    },
                    animationConfig: ()=> PopupManager.jumpAnimationConfiguration,
                    clickOnPanelToClose: true
                }
                new ControlEvent(UIPanelEvent.SHOW_POPUP, Data).dispatch();
                break;
            case SlotMachineState.SPIN_RESULT_BONUS_GAME: 
            const bonusGameIntroData: PopupData = {
                type: PopupType.BONUS_GAME_INTRO,
                hideOnClick: false,
                duration: -1,
                callbacks: {
                    onPopupHidden: () => {
                        new ControlEvent(SlotGameEvent.BONUS_GAME_WIN_SHOWN).dispatch();;
                    }
                },
                animationConfig: () => PopupManager.jumpAnimationConfiguration,
                clickOnPanelToClose: false
            }
            new ControlEvent(UIPanelEvent.SHOW_POPUP, bonusGameIntroData).dispatch();
            break;

            case SlotMachineState.BONUS_GAME_ROUND_START:
                new ControlEvent(SlotGameEvent.BONUS_GAME_STARTED).dispatch();
                break;
            
            case SlotMachineState.BONUS_GAME:
                break;

            case SlotMachineState.BONUS_GAME_ROUND_END: 
                const bonusGameOutroData: PopupData = {
                    type: PopupType.BONUS_GAME_OUTRO,
                    hideOnClick: false,
                    duration: -1,
                    callbacks: {
                        onPopupHidden: () => {
                            new ControlEvent(SlotGameEvent.BONUS_GAME_COMPLETE).dispatch();;
                        }
                    },
                    animationConfig: () => PopupManager.jumpAnimationConfiguration,
                    clickOnPanelToClose: false
                }
                new ControlEvent(UIPanelEvent.SHOW_POPUP, bonusGameOutroData).dispatch();
                break;

            case SlotMachineState.COMMUNICATION_ERROR:
                const data: PopupData = {
                    type: PopupType.CONNECTION_LOST,
                    hideOnClick: false,
                    duration: -1,
                    callbacks: null
                }
                new ControlEvent(UIPanelEvent.SHOW_POPUP, data).dispatch();
                break;
        }
    }

    protected resize(availableWidth: number, availableHeight: number, resizeMethod?: ResizeMethod) {
        super.resize(availableWidth, availableHeight, resizeMethod);

        if (!this.stage) {
            return;
        }

        this.stage.x = (availableWidth - this.baseWidth * this.stage.scale.x) / 2;
        this.stage.y = (availableHeight - this.baseHeight * this.stage.scale.y) / 2;

        this.currentWidth = availableWidth / this.stage.scale.x;
        this.currentHeight = availableHeight / this.stage.scale.y;

        if (this._activeMainGameView) {
            this._activeMainGameView.updateLayout(this.updateLayoutDescription);
        }

        if (this.popupManager) {
            this.popupManager.updateLayout(this.updateLayoutDescription);
            this.popupManager.position.set(this.baseWidth / 2, this.baseHeight / 2);
        }
    }

    private onUiActivePanelChanged(): void {
        const uiState = container.resolve(UIState);
        switch (uiState.activePanel) {
            case UIPanelType.HISTORY:
                this.popupVertical = this.historyPanelVertical = new HistoryPanel('HistoryPanel');
                this.popupDesktop = this.historyPanelHorizontal = new HistoryPanel('HistoryPanelDesktop');
                break;
            case UIPanelType.AUTOSPIN_SETTINGS:
                this.popupVertical = this.autospinPanelVertical ??= new AutospinPanelMobile(AssetsManager.layouts.get('AutospinPanelMobile'));
                this.popupDesktop = this.autospinPanelHorizontal ??= new AutospinPanelDesktop('AutospinPanelDesktop');

                break;
            case UIPanelType.BET_SETTINGS:
                this.popupVertical = this.adjustBetPanelVertical ??= new AdjustBetPanelVertical(
                    AssetsManager.layouts.get('AdjustBetPanelVertical')
                );
                this.popupDesktop = this.adjustBetPanelHorizontal ??= new AdjustBetPanelHorizontal(
                    AssetsManager.layouts.get('AdjustBetPanelHorizontal')
                );
                break;
            case UIPanelType.PAYTABLE:
                this.popupVertical = this.paytablePanelVertical ??= new PaytablePanelMobile({
                        symbolsList: SymbolsList,
                        excludedSymbols: [25],
                        symbolsWithDescription: [
                            {
                                itemId: 2,
                                symbolId: 25
                            },
                        ],
                        minBet: this.wallet.getCurrencyValue(this.slotMachine.description.betLimits[0] * 20, true), // combinations (bet multiplier) is 20 for minimum bet (i.e. without antebet enabled)
                        maxBet: this.wallet.getCurrencyValue(this.slotMachine.description.betLimits[this.slotMachine.description.betLimits.length - 1] * 20, true)  // combinations (bet multiplier) is 20 for maximum bet (i.e. without antebet)

                    });
                    this.popupDesktop = this.paytablePanelHorizontal ??= new PaytablePanelDesktop({
                        symbolsList: SymbolsList,
                        excludedSymbols: [25],
                        symbolsWithDescription:[
                            {
                                itemId: 2,
                                symbolId: 25
                            }
                        ],
                        minBet: this.wallet.getCurrencyValue(this.slotMachine.description.betLimits[0] * 20, true), // combinations (bet multiplier) is 20 for minimum bet (i.e. without antebet enabled)
                        maxBet: this.wallet.getCurrencyValue(this.slotMachine.description.betLimits[this.slotMachine.description.betLimits.length - 1] * 20, true)  // combinations (bet multiplier) is 20 for maximum bet (i.e. without antebet)

                    });

                break;
            case UIPanelType.SYSTEM_SETTINGS:
                this.popupDesktop = this.systemSettingsPanelHorizontal ??= new SystemSettingsPanelHorizontal();
                this.popupVertical = this.systemSettingsPanelVertical ??= new SystemSettingsPanelVertical();
                break
            default:
                this.popupManager.hide();
                return;
        }

        this.popupVertical?.updateLayout(this.updateLayoutDescription);
        this.popupDesktop?.updateLayout(this.updateLayoutDescription);

        this.popupManager.show(
            this.popupDesktop,
            this.popupVertical,
            -1,
            true,
            null,
            () =>
                this.orientation == ScreenOrientation.VERTICAL
                    ? PopupManager.slideAnimationConfiguration
                    : PopupManager.defaultAnimationConfiguration,
            {
                showSound: {
                    id: SoundListExtended.UI_POPUP_COMMON_WINDOW,
                },
                hideSound: {
                    id: SoundListExtended.UI_POPUP_HIDE,
                },
            }
        );
    }

    private get updateLayoutDescription(): UpdateLayoutDescription {
        return {
            orientation: this.orientation,
            baseWidth: this.baseWidth,
            baseHeight: this.baseHeight,
            currentWidth: this.currentWidth,
            currentHeight: this.currentHeight
        }
    }

    private onActivePopupChanged(): void {
        const popupState: PopupState = container.resolve(PopupState);
        const sm:SlotMachine = container.resolve(SlotMachine)

        if (popupState.activePopup === null) {
            this.popupManager.hide();
            return;
        }

        let popupHorizontal: DisplayObject = null;
        let popupVertical: DisplayObject = null;
        let showSound: string = SoundListExtended.UI_POPUP_COMMON_WINDOW
        switch (popupState.activePopup.type) {
            case PopupType.NOT_ENOUGH_BALANCE:
                popupHorizontal = this.popupBalanceVertical ??= new PopupNotEnoughBalance();
                popupVertical = this.popupBalanceHorizontal ??= new PopupNotEnoughBalance();
                break;
            case PopupType.CONNECTION_LOST:
                popupHorizontal = this.popupConnectionLostVertical ??= new PopupConnectionLost(() =>sm.currentError);
                popupVertical = this.popupConnectionLostHorizontal ??= new PopupConnectionLost(() =>sm.currentError);
                showSound = SoundListExtended.UI_ERROR_APPEARANCE;
                break;
            case PopupType.FEATURE_BUY:
                popupHorizontal = this.popupFeatureBuyVertical ??= new PopupFeatureBuy();
                popupVertical = this.popupFeatureBuyHorizontal ??= new PopupFeatureBuy();
                break;
                case PopupType.BIG_WIN:
                popupHorizontal = this.popupBigWinHorizontal ??= new PopupBigWin(
                    () => this.slotMachine.bigWinLevel(this.slotMachine.roundResult),
                    () => this.slotMachine.roundResult.spins[this.slotMachine.roundResult.spins.length - 1].currentTotalWinValue,
                    new Text('', {
                        fontFamily: AssetsManager.webFonts.get('InterRegular').family,
                        fill: [0xffc300],
                        fontSize: 68,
                        lineJoin: 'round',
                        fontWeight:'bolder'
                    })
                );
                popupVertical = this.popupBigWinVertical ??= new PopupBigWin(
                    () => this.slotMachine.bigWinLevel(this.slotMachine.roundResult),
                    () => this.slotMachine.roundResult.spins[this.slotMachine.roundResult.spins.length - 1].currentTotalWinValue,
                    new Text('', {
                        fontFamily: AssetsManager.webFonts.get('InterRegular').family,
                        fill: [0xffc300],
                        fontSize: 68,
                        lineJoin: 'round',
                         fontWeight:'bolder'
                    })
                );
                break
            case PopupType.FREE_SPIN_INTRO:
                const freespin = this.slotMachine.currentSpinResult.freespins;
                popupHorizontal = this.popupFreespinsHorizontal = new PopupFreespins(this.language,
                    this.slotMachine.currentSpinResult.freespins.remainingCount, this.orientation,0,"",false,
                    freespin?.remainingCount === freespin?.totalCount
                );
                popupVertical = this.popupFreespinsVertical = new PopupFreespins(this.language,
                    this.slotMachine.currentSpinResult.freespins.remainingCount, this.orientation,0,"",false,
                    freespin?.remainingCount === freespin?.totalCount
                );
                break;
            case PopupType.FREE_SPIN_OUTRO:
                popupHorizontal = this.popupFreespinsHorizontal = new PopupFreespins(this.language,
                    this.slotMachine.roundResult.totalWinValue, this.orientation,this.slotMachine.roundResult.spins[0].freespins.totalCount, Wallet.currency.isoCode, true
                  );
                popupVertical = this.popupFreespinsVertical = new PopupFreespins(this.language,
                    this.slotMachine.roundResult.totalWinValue, this.orientation,this.slotMachine.roundResult.spins[0].freespins.totalCount, Wallet.currency.isoCode, true
               );
            break;
            case PopupType.BONUS_GAME_INTRO:
                popupHorizontal = this.popupBonusspinsIntroHorizontal ??= new PopupBonusspinsIntro(
                    AssetsManager.layouts.get('PopupBonusspinsIntroHorizontal'),
                    () => { return this.slotMachine.currentSpinResult.bonus.remainingCount },
                    () => { return calculateDaysAndHours(this.slotMachine.currentSpinResult.bonus.expiredInMS) },
                    () => { return this.slotMachine.currentSpinResult.bonus.remainingCount !== this.slotMachine.currentSpinResult.bonus.totalCount }
                );
                popupVertical = this.popupBonusspinsIntroVertical ??= new PopupBonusspinsIntro(
                    AssetsManager.layouts.get('PopupBonusspinsIntroVertical'),
                    () => { return this.slotMachine.currentSpinResult.bonus.remainingCount },
                    () => { return calculateDaysAndHours(this.slotMachine.currentSpinResult.bonus.expiredInMS) },
                    () => { return this.slotMachine.currentSpinResult.bonus.remainingCount !== this.slotMachine.currentSpinResult.bonus.totalCount }
                );
                break;
            case PopupType.BONUS_GAME_OUTRO:
                popupHorizontal = this.popupBonusspinsOutroHorizontal ??= new PopupBonusspinsOutro(
                    AssetsManager.layouts.get('PopupBonusspinsOutroHorizontal'),
                    () => { return this.slotMachine.currentSpinResult.bonus.winAmount }
                );
                popupVertical = this.popupBonusspinsOutroVertical ??= new PopupBonusspinsOutro(
                    AssetsManager.layouts.get('PopupBonusspinsOutroVertical'),
                    () => { return this.slotMachine.currentSpinResult.bonus.winAmount }
                );
                break;
        }

        popupHorizontal?.['updateLayout']?.(this.updateLayoutDescription);
        popupVertical?.['updateLayout']?.(this.updateLayoutDescription);

        this.popupManager.show(
            popupHorizontal,
            popupVertical,
            popupState.activePopup.duration,
            popupState.activePopup.hideOnClick,
            popupState.activePopup.callbacks,
            popupState.activePopup.animationConfig,
            {
                showSound: {
                    id: popupState.activePopup.showSound ? popupState.activePopup.showSound : showSound,
                },
                hideSound: {
                    id: SoundListExtended.UI_POPUP_HIDE,
                },
            },
            popupState.activePopup.clickOnPanelToClose
        );
    }

    private onNotEnoughBalance(): void {
        const data: PopupData = {
            type: PopupType.NOT_ENOUGH_BALANCE,
            hideOnClick: true,
            duration: -1,
            callbacks: {
                onPopupHidden: () => {
                    this.slotMachine.currentState = SlotMachineState.IDLE;
                }
            }
        }
        new ControlEvent(UIPanelEvent.SHOW_POPUP, data).dispatch();
    }

    private getProperWinSound(winLevel: number): string {
        if (winLevel === 1)
            return SoundListExtended.GREAT_WIN;
        else if (winLevel === 2)
            return SoundListExtended.HUGE_WIN;
        else if (winLevel === 3)
            return SoundListExtended.INSANE_WIN;

        return SoundListExtended.GOOD_WIN;
    }
}
