import { BlurFilter, Circle, Graphics, isMobile, Matrix, RoundedRectangle, Sprite, Text, Texture } from 'pixi.js';
import LayoutElement from '../../../core/view/model/LayoutElement';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import Button, { ButtonState } from '../../../core/view/ui/Button';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { WalletEvent } from '../../../slots/model/event/WalletEvent';
import Wallet from '../../../slots/model/Wallet';
import SlotMachine from '../../../slots/model/SlotMachine';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';
import { container } from 'tsyringe';
import SoundManager from '../../../core/sound/SoundManager';
import ValueText from '../../../core/view/text/ValueText';
import { UIPanelEvent } from '../../control/event/UIPanelEvent';
import UIState, { UIPanelType } from '../../model/UIState';
import AssetsManager from '../../../core/assets/AssetsManager';
import ButtonSpin from '../ButtonSpin';
import SoundList from '../../sound/SoundList';
import { UIPanellConfiguration } from '../../model/UIPanelConfiguration';
import AdjustableLayoutContainer from '../../../core/view/AdjustableLayoutContainer';
import ButtonAutospin from '../ButtonAutospin';
import { UIEvent } from '../../../slots/control/event/UIEvent';
import { AutoplayEvent } from '../../../slots/model/event/AutoplayEvent';
import { SlotMachineState } from '../../../slots/model/SlotMachineState';
import ButtonSpinAnimation from '../ButtonSpinAnimation';
import { SlotGameEvent } from '../../../slots/control/event/SlotGameEvent';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import BalanceInfo from '../../model/BalanceInfo';
import { CascadeHistoryView } from './CascadeHistoryView';
import { FreeSpinButton } from './FreeSpinButton';
import { DoubleChanceButton } from './DoubleChanceButton';
import ButtonVolume from '../ButtonVolume';
import PopupState, { PopupType } from '../../model/PopupState';
import UISettingsDesktop from './UISettingsDesktop';
import StatusComponent from './StatusComponent';
import ICommonGameService from '../../services/ICommonGameService';
import EventEmitter from 'eventemitter3'
import { GameServiceEvent } from '../../../../drunkie-monkey/services/event/GameServiceEvent';
import MultiplierFrame from '../MultiplierFrame';
import { Tweener } from '../../../core/tweener/engineTween';
import { ButtonVolumeEvent } from '../../model/event/ButtonVolumeEvent';
import MainGameScreen from '../../../../drunkie-monkey/view/MainGameScreen';
import GraphicUtils from '../../../slots/utils/GraphicUtils';

export default class UIPanelDesktop extends AdjustableLayoutContainer {
    private baseYPositions: {
        btnTurbo: number,
        btnAutospin: number,
        btnMinus: number,
        btnPlus: number,
        btnSpin: number,
        uiSettings: number,
        btnFreeSpin: number,
        btnSettings: number,
        btnVolume: number,
        btnInfo: number,
        brandWatermark: number,
        balance: number,
        btnBet: number,
        btnWin: number,
        background: number,
        tfHoldDownSpace: number;
    }

    private gs: ICommonGameService;
    private wallet: Wallet;
    private slotMachine: SlotMachine;
    public btnSettings: Button

    private _config: UIPanellConfiguration;

    // VISUALS
    private uiSettingsDesktop: UISettingsDesktop;
    public btnVolume: ButtonVolume;
    public btnInfo: Button;
    private btnBetUp: Button
    private btnBetDown: Button
    private btnAutoSpin: ButtonAutospin;
    public btnFreeSpin: FreeSpinButton;
    public balance;
    public btnBet;
    public btnWin;
    public tfHoldDownSpace;
    private tfBet: Text;
    private tfBalance: ValueText;
    public tfWin: Text;

    private btnDoubleChance?: DoubleChanceButton;
    private cascadeHistoryPanel: CascadeHistoryView;


    public multiplierFrame: MultiplierFrame
    private brandWatermark: Sprite;

    public btnTurboSpinEnable: Button;
    public btnTurboSpinDisable: Button;
    public statusComponent: StatusComponent

    private background: Graphics;
    private mainGameScreen: MainGameScreen;
    protected blurBg: Sprite;
    // helper structure description

    public btnSpin: ButtonSpin;

    constructor(config: UIPanellConfiguration, mainGame: MainGameScreen) {
        super(AssetsManager.layouts.get('UIPanelDesktop'));

        this._config = config;

        LayoutBuilder.create(this.layout, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.mainGameScreen = mainGame;

        this.tfBalance = this['balance'].text;
        this.tfBet = this.btnBet['text'];
        this.tfWin = this.btnWin['text'];
        this.tfWin.style.fontWeight = 'bolder';

        // additional container is used to keep scale bounce animation intact
        this.btnSpin = this['btnSpinContainer'].btnSpin;
        this.tfHoldDownSpace.style.align = 'right';

        this.wallet = container.resolve(Wallet);
        this.slotMachine = container.resolve(SlotMachine);
        this.tfWin.text = `${this.wallet.getCurrencyValue(this.slotMachine.roundResult.nextType === 10 ? this.slotMachine.roundResult?.totalWinValue : 0, true)}`;

        this.wallet.on(WalletEvent.BALANCE_CHANGED, this.onWalletBalanceChanged, this);
        this.wallet.on(WalletEvent.NOT_ENOUGH_BALANCE, () => {
            this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.STOP);
        }, this);
        this.onWalletBalanceChanged()

        this.slotMachine.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
        this.wallet.on(WalletEvent.COIN_VALUE_CHANGED, this.onBetValueChanged, this);
        this.onBetValueChanged()

        this.baseYPositions = {
            btnTurbo: this.btnTurboSpinEnable.position.y,
            btnAutospin: this.btnAutoSpin.position.y,
            btnMinus: this.btnBetDown.position.y,
            btnPlus: this.btnBetUp.position.y,
            btnSpin: this['btnSpinContainer'].position.y,
            uiSettings: this.uiSettingsDesktop.position.y,
            btnFreeSpin: this.btnFreeSpin.position.y,
            btnSettings: this.btnSettings.position.y,
            btnVolume: this.btnVolume.position.y,
            btnInfo: this.btnInfo.position.y,
            brandWatermark: this.brandWatermark.position.y,
            balance: this.balance.position.y,
            btnBet: this.btnBet.position.y,
            btnWin: this.btnWin.position.y,
            background: this.background.position.y,
            tfHoldDownSpace: this.tfHoldDownSpace.position.y,
        }

        this.btnBetUp.on('pointerup', this.onBtnBetUp, this);
        this.btnBetDown.on('pointerup', this.onBtnBetDown, this);
        this.btnAutoSpin.on('pointerup', this.onBtnAutoSpin, this);
        this.btnTurboSpinEnable.on('pointerup', this.onBtnTurboSpinEnable, this);
        this.btnTurboSpinDisable.on('pointerup', this.onBtnTurboSpinDisable, this);
        this.btnSpin.on('pointerup', this.onBtnSpin, this);
        this.btnSettings.on('pointerup', this.onBtnSettings, this)
        this.btnInfo.on('pointerup', this.onBtnPaytable, this);

        this.gs = this.gs = container.resolve<ICommonGameService>('GameService');
        (this.gs as unknown as EventEmitter).on(GameServiceEvent.SETTINGS_CHANGED, () => {
            this.updateVolume();
        }, this);
        this.btnVolume.on(ButtonVolumeEvent.STATE_CHANGED, this.onBtnVolume, this)
        this.updateVolume()


        this.wallet = container.resolve(Wallet);
        this.slotMachine = container.resolve(SlotMachine);

        this.wallet.on(WalletEvent.NOT_ENOUGH_BALANCE, () => {
            this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.STOP);
        }, this);

        this.slotMachine.on(SlotMachineEvent.STATE_CHANGED, this.onSlotMachineStateChanged, this);

        this.slotMachine.autoplay.on(AutoplayEvent.ENABLED, this.onAutospinEnabled, this);
        this.slotMachine.autoplay.on(AutoplayEvent.DISABLED, this.onAutospinDisabled, this);
        this.slotMachine.autoplay.on(AutoplayEvent.SPINS_LEFT_CHANGED, this.onAutospinSpinsLeftChange, this);
        this.onAutospinSpinsLeftChange();
        this.gs = container.resolve<ICommonGameService>('GameService');
        (this.gs as unknown as EventEmitter).on(GameServiceEvent.SETTINGS_CHANGED, () => {
            this.updateVolume();
        }, this);
        this.updateVolume()
        this.statusComponent.winValue = 0
        this.slotMachine.on(SlotMachineEvent.GAME_SPEED_LEVEL_CHANGED, this.onGameSpeedLevelChanged, this);
        this.onGameSpeedLevelChanged(this.slotMachine.currentGameSpeedLevel);

        document.body.addEventListener('keydown', (e) => this.onSpaceClick(e));
        document.body.addEventListener('keyup', (e) => this.onSpaceButtonLeft(e));
        this.statusComponent.visible = false
        if(!this.gs.settings.introScreen)
            {
            
               this.muteonIntro()
            }
    }

    private updateView(): void{
            const btnBetUpActive: boolean = this.slotMachine.currentBetValue < this.slotMachine.description.betLimits[ this.slotMachine.description.betLimits.length-1];
            const btnBetDownActive: boolean = this.slotMachine.currentBetValue > this.slotMachine.description.betLimits[0];
    
            const view: Map<Button, boolean> = new Map<Button,boolean>([
                [this.btnBetUp, btnBetUpActive],
                [this.btnBetDown, btnBetDownActive],
            ]);
    
            view.forEach((active: boolean, btn: Button): void => {
                btn.setState(active ? ButtonState.NORMAL : ButtonState.DISABLED);
                btn.enabled = active;
            });
        }

    // PUBLIC API
    public lock(bonusRoundActive: boolean = false): void {
        [
            this.btnBetDown,
            this.btnBetUp,
            this.btnFreeSpin,
            this.btnInfo,
            this.btnSettings
        ].forEach((btn: Button) => {
            if (btn) {
                btn.enabled = false;
            }
        });
        if (this.uiSettingsDesktop) {
            this.uiSettingsDesktop.lock()
        }

        if (!this.slotMachine.autoplay.enabled) {
            this.btnAutoSpin.enabled = false;
            this.btnSpin.enabled = false;
            if (bonusRoundActive) this.btnSpin.enabled = true;
        }
        if (bonusRoundActive) this.btnInfo.enabled = true;
        if (this.mainGameScreen.isFreeSpins) {
            this.btnSpin.alpha = 0.4
        }else{
            this.btnSpin.alpha = 1;
        }

        new ControlEvent(UIPanelEvent.CLOSE_SETTINGS).dispatch();
    }

    public unlock(bonusRoundActive: boolean = false): void {
        if (bonusRoundActive) {
            [this.btnSpin, this.btnInfo].forEach(btn => btn.enabled = true);
        } else {
            [this.btnSpin, this.btnBetUp, this.btnBetDown, this.btnFreeSpin, this.btnAutoSpin, this.btnSettings, this.btnInfo].forEach((btn: Button) => {

                btn.enabled = true;
            });
            this.updateView();
        };
        if (this.uiSettingsDesktop)
            this.uiSettingsDesktop.unlock()
        this.btnSpin.alpha = 1;
        if(this.slotMachine.autoplay?.spinsLeft <= 0){
            this.btnSpin.waitAnimation(ButtonSpinAnimation.WAIT_DELAY)
        }
    }

    public set winValue(value: number | string) {
        if (typeof value == "number")
            this.tfWin.text = `${this.wallet.getCurrencyValue(value, true)}`;
    }

    public onSlotMachineStateChanged(currentState: SlotMachineState): void {
        const sm: SlotMachine = this.slotMachine;
        const wallet: Wallet = container.resolve(Wallet);
        const gs: ICommonGameService = container.resolve<ICommonGameService>('GameService');

        switch (currentState) {
            case SlotMachineState.SPINNING:
                this.statusComponent.winValue = 0
                break;
            case SlotMachineState.SPIN_END:
                break;
            case SlotMachineState.COMMUNICATION_ERROR:
                break;
            case SlotMachineState.SPIN_RESULT_MULTI_WIN:
                break;
            case SlotMachineState.SPIN_RESULT_SCATTER:
                break;
            case SlotMachineState.SPIN_RESULT_CASCADE:
                break;
            case SlotMachineState.SPIN_RESULT_FREE_SPINS:
                break;
            case SlotMachineState.FREE_SPINS_ROUND_START:
                // this.showMultiplierFrame();
                // this.multiplierFrame.value = this.slotMachine.currentSpinResult.totalWinMultiplier;
                break;
            case SlotMachineState.FREE_SPINS:
                break;
            case SlotMachineState.FREE_SPINS_ROUND_END:
                break;
            case SlotMachineState.IDLE:
                this.statusComponent.winValue = 0
                this.hideMultiplierFrame();
                this.multiplierFrame.value = 0;
                break;
        }
    }

    private updateVolume(): void {
        this.btnVolume.setInitialState(this.gs.settings.ambientMusic, this.gs.settings.soundFx)
    }
    // public set winValue(value: number | string) {
    //     if(typeof value == "number")
    //         this.tfWin.text = `${AssetsManager.translations.get('tfDesktopWin')} ${this.wallet.getCurrencyValue(value)}`;
    //
    // }

    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        this.background.width = desc.currentWidth;
        // this.background.x = -(desc.currentWidth - desc.baseWidth) / 2;

        if (desc.currentHeight > desc.baseHeight) {
            this.background.y = this.statusComponent.y = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
        } else {
            this.background.y = this.statusComponent.y = desc.baseHeight + 100;
        }
        this.background.y = 1170

        let bottomY: number = desc.baseHeight;
        if (desc.currentHeight > desc.baseHeight) {
            bottomY = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
        }
        this.btnTurboSpinEnable.y = this.btnTurboSpinDisable.y = bottomY - (desc.baseHeight - this.baseYPositions.btnTurbo);
        this.btnAutoSpin.y = bottomY - (desc.baseHeight - this.baseYPositions.btnAutospin);
        this.btnBetDown.y = bottomY - (desc.baseHeight - this.baseYPositions.btnMinus);
        this.btnBetUp.y = bottomY - (desc.baseHeight - this.baseYPositions.btnPlus);
        this.btnVolume.y = bottomY - (desc.baseHeight - this.baseYPositions.btnVolume);
        this.balance.y = bottomY - (desc.baseHeight - this.baseYPositions.balance);
        this.btnWin.y = bottomY - (desc.baseHeight - this.baseYPositions.btnWin);
        this.btnBet.y = bottomY - (desc.baseHeight - this.baseYPositions.btnBet);
        this.brandWatermark.y = bottomY - (desc.baseHeight - this.baseYPositions.brandWatermark);
        this.btnInfo.y = bottomY - (desc.baseHeight - this.baseYPositions.btnInfo);
        this.background.y = bottomY - (desc.baseHeight - this.baseYPositions.background);
        this.tfHoldDownSpace.y = bottomY - (desc.baseHeight - this.baseYPositions.tfHoldDownSpace);
        this.btnSettings.y = bottomY - (desc.baseHeight - this.baseYPositions.btnSettings);
        this['btnSpinContainer'].y = bottomY - (desc.baseHeight - this.baseYPositions.btnSpin);
        this.uiSettingsDesktop.y = bottomY - (desc.baseHeight - this.baseYPositions.uiSettings);
        this.updateBlurBg(desc);
    }

    public updateBlurBg(desc: UpdateLayoutDescription): void {
        const blurFilter: BlurFilter = new BlurFilter();
        blurFilter.blur = 15;
        blurFilter.quality = 15;

        const matrix = new Matrix();
        matrix.translate((desc.currentWidth - desc.baseWidth) / 2, - ((desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2) - this.background.height));

        this.blurBg && this.blurBg.destroy(true);
        this.visible = false;
        const texture: Texture = GraphicUtils.generateFilteredTextureFromContainer(this.mainGameScreen, desc.currentWidth, this.background.height, matrix, [blurFilter]);
        this.blurBg = new Sprite(texture);
        this.blurBg.name = "blurBackground";
        this.blurBg.pivot.set(this.background.width / 2, this.background.height / 2);
        this.blurBg.position = this.background.position;

        this.addChildAt(this.blurBg, 0);
        this.visible = true;
    }

    // PRIVATE API
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;
        let btn: Button;
        let radius: number;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                btn = instance as Button;
                btn.hitArea = new Circle(btn.width / 2, btn.height / 2, btn.width / 2);
                break;
            case 'ButtonSpin':
                instance = new ButtonSpin(le);
                btn = instance as Button;
                btn.hitArea = new Circle(100, 100, 90);
                break;
            case 'ButtonAutospin':
                instance = new ButtonAutospin(le);
                btn = instance as Button;
                btn.hitArea = new RoundedRectangle(0, 0, btn.width, btn.height, btn.width / 2)
                break;
            case 'ValueText':
                instance = new ValueText(le);
                break;
            case 'BalanceInfo':
                instance = new BalanceInfo(le);
                break;
            case 'CascadeHistoryPanel':
                instance = new CascadeHistoryView(le);
                break;
            case 'FreeSpinButton':
                instance = new FreeSpinButton(le);
                break;
            case 'DoubleChanceButton':
                instance = new DoubleChanceButton(le);
                break;
            case 'ButtonVolume':
                instance = new ButtonVolume(le);
                break
            case 'MultiplierFrame':
                instance = new MultiplierFrame(le)
                break
            case 'UISettingsDesktop':
                instance = new UISettingsDesktop(le);
                break
            case 'ButtonTurbo':
                instance = new Button(le);
                btn = instance as Button;
                btn.hitArea = new Circle(80, 80, 45)
                break;
            case 'StatusComponent':
                instance = new StatusComponent(le);
                break;
        }

        return instance;
    }


    private onAutospinEnabled(): void {
        this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN);
        this.btnSpin.hideOrShowStopText();
    }

    private onAutospinDisabled(): void {
        if (this.slotMachine.currentState !== SlotMachineState.IDLE && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME_ROUND_START) {
            this.btnAutoSpin.enabled = false;
        }
        this.btnSpin.hideOrShowStopText();
    }

    private onAutospinSpinsLeftChange(): void {
        this.btnAutoSpin.autospinChange(this.slotMachine.autoplay.spinsLeft);
        this.btnSpin.updateSpinCount(this.slotMachine.autoplay.spinsLeft <= 0 ? '' : String(this.slotMachine.autoplay.spinsLeft));
    }


    private onGameSpeedLevelChanged(speedLevel: number): void {
        this.btnTurboSpinEnable.visible = (speedLevel == 0);
        this.btnTurboSpinDisable.visible = (speedLevel == 1);

        this.gs.settings.quickSpin = speedLevel != 0

    }
    // USER INTERACTION
    private onBtnSettings() {
        SoundManager.play(SoundList.UI_BUTTON_CLICK)
        new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.SYSTEM_SETTINGS).dispatch()
    }

    private onBtnBetUp(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        // new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.BET_SETTINGS).dispatch();
        new ControlEvent(UIEvent.BET_QUANTITY_UP).dispatch();
    }
    private onBtnBetDown(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        // new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.BET_SETTINGS).dispatch();
        new ControlEvent(UIEvent.BET_QUANTITY_DOWN).dispatch();
    }
    private onBtnPaytable(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.PAYTABLE).dispatch();
    }
    private muteonIntro(): void {
       
        
            this.gs.settings.ambientMusic = false;
            this.gs.settings.soundFx = false;
            SoundManager.getChannel('default').mute = SoundManager.getChannel('ambient').mute = true;
            
        // }
        this.gs.saveSettings();
    }
    private onBtnVolume(): void {
        console.log('onBtnVolume3')
        if (!this.gs.settings.ambientMusic && !this.gs.settings.soundFx) {
            this.gs.settings.ambientMusic = true;
            this.gs.settings.soundFx = true;
        }
        else {
            this.gs.settings.ambientMusic = false;
            this.gs.settings.soundFx = false;
        }
        this.gs.saveSettings();
        SoundManager.getChannel('ambient').mute = !this.gs.settings.ambientMusic;
        SoundManager.getChannel('default').mute = !this.gs.settings.soundFx;
    }

    private onBtnAutoSpin(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        if (this.slotMachine.autoplay.enabled) {
            new ControlEvent(UIEvent.AUTO_SPIN).dispatch();
        } else {
            new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.AUTOSPIN_SETTINGS).dispatch();
        }
    }

    private onBtnTurboSpinEnable(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIEvent.GAME_SPEED_LEVEL_UP).dispatch();
    }

    private onBtnTurboSpinDisable(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIEvent.GAME_SPEED_LEVEL_DOWN).dispatch();
    }

    private onBtnSpin(): void {
        if (this.mainGameScreen.isFreeSpins) return;
        if (this.slotMachine.currentState !== SlotMachineState.IDLE && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME_ROUND_START) {
            if (this.slotMachine.stopRequested)
                return;
            SoundManager.play(SoundList.UI_BUTTON_SPIN_STOP);
            this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN);
            new ControlEvent(SlotGameEvent.STOP_REQUESTED).dispatch();
            this.btnSpin.enabled = false;
            if (this.slotMachine.autoplay.enabled) {
                new ControlEvent(UIEvent.AUTO_SPIN).dispatch();
            }
        } else {
            SoundManager.play({
                id: SoundList.UI_BUTTON_SPIN_START,
                volume: 0.3
            });
            this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN, false, this._config.UIMainConfiguration.buttonSpinConfig.useRotationInStartAnimation, false);
            new ControlEvent(SlotGameEvent.SPIN_START).dispatch();
            this.btnSpin.enabled = true;
        }
    }
    private onSpaceClick(event: KeyboardEvent) {
        const uiState: UIState = container.resolve(UIState);
        const popupState: PopupState = container.resolve(PopupState);
        if (event.code === 'Space') {
            if (!uiState.activePanel && !popupState.activePopup) {
                if(!this.mainGameScreen.isFreeSpins){
                    if(!(this.slotMachine.currentGameSpeedLevel>0)){
                        this.btnTurboSpinDisable.visible = true
                        this.btnTurboSpinEnable.visible = false
                    }
                }
                this.onBtnSpin();
            }
        }
    }

    private onSpaceButtonLeft(event: KeyboardEvent){
        if (event.code === 'Space'){
            if(!(this.slotMachine.currentGameSpeedLevel>0)){
                this.btnTurboSpinDisable.visible = false
                this.btnTurboSpinEnable.visible = true
            }
        }
    }

    private showMultiplierFrame(): void {
        const offsetY: number = 15;
        const newPosition: number = this.cascadeHistoryPanel.y - this.btnFreeSpin.height - offsetY;
        if (this.btnDoubleChance) {
            Tweener.addTween(this.btnDoubleChance, {
                alpha: 0,
                time: 1,
                onComplete: () => {
                    this.btnDoubleChance.visible = false
                },
            });
        }

        Tweener.addTween(this.btnFreeSpin, {
            y: newPosition,
            time: 1,
            delay: 0.5
        });

        Tweener.addTween(this.multiplierFrame, {
            alpha: 1,
            time: 2,
            delay: 0.6,
            onStart: () => {
                this.multiplierFrame.visible = true;
            }
        });
    }

    private hideMultiplierFrame(): void {
        //const offsetY: number = 17;
        Tweener.addTween(this.multiplierFrame, {
            alpha: 0,
            time: 1,
            onStart: () => {
                Tweener.addTween(this.btnFreeSpin, {
                    y: this.baseYPositions.btnFreeSpin, //- offsetY,
                    time: 1
                });
            },
            onComplete: () => {
                this.multiplierFrame.visible = false;
            }
        });

        if (this.btnDoubleChance) {
            this.btnDoubleChance.visible = true
            Tweener.addTween(this.btnDoubleChance, {
                alpha: 1,
                time: 1
            });
        }
    }

    public onWalletBalanceChanged(): void {
        this.tfBalance.renderValueFunction = (tf, value) => {
            tf.text = `${this.wallet.getCurrencyValue(value, true)}`;
        }

        //To fix the issue when previous tween is not finished yet
        if (Tweener.isTweening(this.tfBalance)) {
            Tweener.removeTweens(this.tfBalance);
            this.tfBalance.value = this.wallet.balance;
            return;
        }

        const balance: number = this.wallet.balance;
        // check if ui present on stage and balance increased
        if (this.parent && (balance > this.tfBalance.value)) {
            this.tfBalance.setValue(balance, {
                countUpDuration: 1
            });
        } else {
            this.tfBalance.value = balance;
        }

    }
    public onBetValueChanged(): void {
        this.tfBet.text = `${this.wallet.getCurrencyValue(this.slotMachine.totalBet * this.wallet.coinValue * Wallet.denomination, true)}`;
        this.animateText(this.tfBet);
        this.updateView();
    }

    private animateText(tf: Text): void {
        Tweener.removeTweens(tf.scale);
        Tweener.addTween(
            tf.scale, {
            x: 1.25,
            y: 1.3,
            transition: 'easeInSine',
            time: 0.1,
            onComplete: () => {
                Tweener.addTween(
                    tf.scale, {
                    x: 1,
                    y: 1,
                    time: 0.12,
                    transition: 'easeOutSine',
                }
                );
            }
        }
        );
    }
}
