import {Circle, Container, RoundedRectangle} from 'pixi.js';
import Button, { ButtonState } from '../../../core/view/ui/Button';
import SoundManager from '../../../core/sound/SoundManager';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { UIEvent } from '../../../slots/control/event/UIEvent';
import { UIPanelEvent } from '../../control/event/UIPanelEvent';
import { SlotGameEvent } from '../../../slots/control/event/SlotGameEvent';
import SlotMachine from '../../../slots/model/SlotMachine';
import { SlotMachineState } from '../../../slots/model/SlotMachineState';
import { container } from 'tsyringe';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';
import { AutoplayEvent } from '../../../slots/model/event/AutoplayEvent';
import LayoutElement from '../../../core/view/model/LayoutElement';
import ValueText from '../../../core/view/text/ValueText';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import  UIState, { UIPanelType } from '../../model/UIState';
import ButtonAutospin from '../ButtonAutospin';
import Wallet from '../../../slots/model/Wallet';
import { WalletEvent } from '../../../slots/model/event/WalletEvent';
import SoundList from '../../sound/SoundList';
import ButtonSpin from '../ButtonSpin';
import ButtonSpinAnimation from '../ButtonSpinAnimation';
import { UIMainConfiguration } from '../../model/UIMainConfiguration';
import ICommonGameService from '../../services/ICommonGameService';
import { SoundChannelEvent } from '../../../core/sound/SoundChannelEvent';
import SoundChannel from '../../../core/sound/SoundChannel';
import ButtonVolume from '../ButtonVolume';
import { Tweener } from '../../../core/tweener/engineTween';
import PopupState, { PopupType } from '../../model/PopupState';
import MainGameScreen from '../../../../drunkie-monkey/view/MainGameScreen';
import GameService from '../../../../drunkie-monkey/services/GameService';
import { GameServiceEvent } from '../../../../drunkie-monkey/services/event/GameServiceEvent';

export default class UIMain extends Container {
    private slotMachine: SlotMachine;
    private wallet :Wallet;
    private _config: UIMainConfiguration;
    private gs: GameService;
    public btnSpin: ButtonSpin;
    public btnMenu:Button;
    public btnAutoSpin: ButtonAutospin;
    private btnBetUp:Button
    private btnBetDown:Button
    public btnTurboSpinEnable: Button;
    public btnTurboSpinDisable: Button;
    public btnVolume: ButtonVolume;
    public btnInfo: Button;
    public btnSettings: Button;
    protected pressAndHoldActivated: boolean = false;
	protected holdWait: number = 0.4;
    mainGameScreen: MainGameScreen;

    constructor(le: LayoutElement, config: UIMainConfiguration,mainGame:MainGameScreen) {
        super();

        this._config = config;
        this.mainGameScreen = mainGame;
        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.btnSpin.on('pointerup', this.onBtnSpinHandler, this);
		this.btnSpin.on('pointerdown', this.onPressAndHoldHandler, this);
        this.btnAutoSpin.on('pointerup', this.onBtnAutoSpin, this);
        this.btnBetUp.on('pointerup', this.onBtnBetUp, this);
        this.btnBetDown.on('pointerup', this.onBtnBetDown, this);
        this.btnVolume.on('pointerup', this.onBtnSfx, this);
        this.btnInfo.on('pointerup', this.onBtnRPaytable, this);
        this.btnSettings.on('pointerup', this.onBtnSettings, this);

        this.btnMenu.visible = false;
        this.btnMenu.alpha = 0;
        this.btnTurboSpinEnable.visible = false;
        this.btnTurboSpinEnable.alpha = 0;
        this.btnTurboSpinDisable.visible = false;
        this.btnTurboSpinDisable.alpha = 0;

        this.wallet = container.resolve(Wallet)
        this.wallet
            .on(WalletEvent.NOT_ENOUGH_BALANCE, () => {
                this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.STOP);
            }, this)
        this.slotMachine = container.resolve(SlotMachine);
        this.gs = container.resolve<GameService>('GameService');
        this.gs.on(GameServiceEvent.SETTINGS_CHANGED, ()=>{
            this.onSfxMuteChange();
        }, this);
        this.slotMachine.autoplay.on(AutoplayEvent.ENABLED, this.onAutospinEnabled, this);
        this.slotMachine.on(SlotMachineEvent.GAME_SPEED_LEVEL_CHANGED, this.onGameSpeedLevelChanged, this);
        this.slotMachine.autoplay.on(AutoplayEvent.DISABLED, this.onAutospinDisabled, this);
        this.slotMachine.autoplay.on(AutoplayEvent.SPINS_LEFT_CHANGED, this.onAutospinSpinsLeftChange, this);
        this.slotMachine.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
        this.onBetValueChanged();
        this.on('added', this.onAdded, this);
    }

    public onBetValueChanged(): void {
            this.updateView();
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

    public lock(bonusRoundActive: boolean): void {
        [this.btnBetUp,this.btnBetDown,/*this.btnTurboSpinDisable*/,this.btnMenu,this.btnInfo,this.btnSettings].forEach((btn: Button) => {
            btn.enabled = false;
        });
        if (!this.slotMachine.autoplay.enabled) {
            this.btnAutoSpin.enabled = false;
            this.btnSpin.enabled = false;
            if(bonusRoundActive)    this.btnSpin.enabled = true;
        }
        if(bonusRoundActive)   this.btnInfo.enabled = true;
        if(this.mainGameScreen.isFreeSpins){
            this.btnSpin.alpha = 0.4;
        }else{
            this.btnSpin.alpha = 1;
        }
    }

    public unlock(bonusRoundActive: boolean): void {
        if(bonusRoundActive) {
            [this.btnSpin, this.btnInfo].forEach(btn => btn.enabled = true);
        } else {
            [this.btnSpin, this.btnAutoSpin,this.btnBetDown,this.btnBetUp, this.btnSettings, this.btnMenu, this.btnInfo].forEach((btn: Button) => {
                btn.enabled = true;
            });
            this.updateView();
        }
        this.btnSpin.alpha = 1;
        if(this.slotMachine.autoplay?.spinsLeft <= 0){
            this.btnSpin.waitAnimation(ButtonSpinAnimation.WAIT_DELAY)
        }
    }

    // PRIVATE API
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;
        let btn: Button;
        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                btn = instance as Button;
                btn.hitArea = new Circle(btn.width/2, btn.height/2, btn.width/2);
                break;
            case 'ButtonVolume':
                instance = new ButtonVolume(le);
                break;
            case 'ButtonSpin':
                instance = new ButtonSpin(le);
                btn = instance as Button;
                btn.hitArea = new Circle(0, 0, btn.width/2-50);
                break;
            case 'ButtonAutospin':
                instance = new ButtonAutospin(le);
                btn = instance as Button;
                btn.hitArea = new RoundedRectangle(0,0,btn.width,btn.height,btn.width/2)
                break;
            case 'ButtonTurbo':
                instance = new Button(le);
                btn = instance as Button;
                btn.hitArea = new Circle(90,90,50)
                break;
            case 'ValueText':
                instance = new ValueText(le);
                break;


        }

        return instance;
    }

    private onAdded(): void {
        this.onGameSpeedLevelChanged(this.slotMachine.currentGameSpeedLevel);
        this.onAutospinSpinsLeftChange();
        const defaultChannel: SoundChannel = SoundManager.getChannel('default');
        defaultChannel.on(SoundChannelEvent.MUTE, this.onSfxMuteChange, this);
        defaultChannel.on(SoundChannelEvent.UNMUTE, this.onSfxMuteChange, this);
        this.onSfxMuteChange();
        document.body.addEventListener('pointerup', (e) => this.removePressAndHold(e));
    }

    private onGameSpeedLevelChanged(speedLevel: number): void {
        this.btnTurboSpinEnable.visible = (speedLevel == 0);
        this.btnTurboSpinDisable.visible = (speedLevel == 1);

        container.resolve<ICommonGameService>('GameService').settings.quickSpin = speedLevel != 0
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
    private onSfxMuteChange():void {
        const soundsEnabled: boolean = SoundManager.getChannel('default').mute;
        const ambientSound: boolean = SoundManager.getChannel('ambient').mute;
        
        this.btnVolume.normal['icon-on'].visible = !soundsEnabled || !ambientSound;
        this.btnVolume.normal['icon-off'].visible = soundsEnabled && ambientSound;
    }
    private onAutospinSpinsLeftChange(): void {
        this.btnAutoSpin.autospinChange(this.slotMachine.autoplay.spinsLeft);
        this.btnSpin.updateSpinCount(this.slotMachine.autoplay.spinsLeft <= 0 ? '' : String(this.slotMachine.autoplay.spinsLeft));
    }

    // USER INTERACTION
    private onBtnSfx(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        if (this.gs.settings.ambientMusic || this.gs.settings.soundFx) {
            this.gs.settings.ambientMusic = false;
            this.gs.settings.soundFx = false;
            SoundManager.getChannel('default').mute = SoundManager.getChannel('ambient').mute = true;
        }
        else {
            this.gs.settings.ambientMusic = true;
            this.gs.settings.soundFx = true;
            SoundManager.getChannel('default').mute = SoundManager.getChannel('ambient').mute = false;
        }
        this.gs.saveSettings();
    }

    private onBtnRPaytable(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.PAYTABLE).dispatch();
    }
    private onBtnSettings(){
        new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.SYSTEM_SETTINGS).dispatch();
    }
   
    
    private onBtnAutoSpin(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        if (this.slotMachine.autoplay.enabled) {
            new ControlEvent(UIEvent.AUTO_SPIN).dispatch();
        } else {
            new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.AUTOSPIN_SETTINGS).dispatch();
        }
    }

    protected onBtnSpinHandler(): void {
		Tweener.removeTweens(this);
		if (this.pressAndHoldActivated) {
			this.pressAndHoldActivated = false;
			return;
		}
		if (this.slotMachine.currentState !== SlotMachineState.IDLE && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME_ROUND_START) {
			if (this.slotMachine.stopRequested) return;
			SoundManager.play(SoundList.UI_BUTTON_SPIN_STOP);
			new ControlEvent(SlotGameEvent.STOP_REQUESTED).dispatch();
            this.btnSpin.enabled = false;
            if (this.slotMachine.autoplay.enabled) {
                new ControlEvent(UIEvent.AUTO_SPIN).dispatch();
            }
		} else {
			SoundManager.play({
				id: SoundList.UI_BUTTON_SPIN_START,
				volume: 0.3,
			});

			new ControlEvent(SlotGameEvent.SPIN_START).dispatch();
			this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN, false, this._config.buttonSpinConfig.useRotationInStartAnimation,false);
			this.btnSpin.enabled = true;
		}
	}

    protected onPressAndHoldHandler(): void {
        if (this.slotMachine.autoplay.enabled)	return;
		Tweener.addCaller(this, {
			count: 1,
			time: this.holdWait,
			onComplete: () => {
				this.pressAndHoldActivated = true;
				this.startPressAndHoldSpin();
			},
		});
	}
    
	protected startPressAndHoldSpin(): void {
		if (this.pressAndHoldActivated) {
			const uiState: UIState = container.resolve(UIState);
			const popupState: PopupState = container.resolve(PopupState);
			if (!uiState.activePanel && (!popupState.activePopup || popupState.activeType !== PopupType.CONNECTION_LOST)) {
				this.onPressAndHoldSpinHandler();
			}
			Tweener.addCaller(this, {
				count: 1,
				time: 0.1,
				onComplete: () => {
					this.startPressAndHoldSpin();
				},
			});
		}
	}

	protected onPressAndHoldSpinHandler(): void {
		if (this.slotMachine.currentState !== SlotMachineState.IDLE && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME && this.slotMachine.currentState !== SlotMachineState.BONUS_GAME_ROUND_START) {
			if (this.slotMachine.stopRequested) return;
			SoundManager.play(SoundList.UI_BUTTON_SPIN_STOP);
			new ControlEvent(SlotGameEvent.STOP_REQUESTED).dispatch();
            this.btnSpin.enabled = false;
            if (!this.slotMachine.autoplay.enabled) this.btnSpin.enabled = false;
		} else {
			SoundManager.play({
				id: SoundList.UI_BUTTON_SPIN_START,
				volume: 0.3,
			});

			new ControlEvent(SlotGameEvent.SPIN_START).dispatch();
			this.btnSpin.spinAnimation(ButtonSpinAnimation.LOOP, ButtonSpinAnimation.SPIN, false, this._config.buttonSpinConfig.useRotationInStartAnimation,false);
			this.btnSpin.enabled = true;
		}
	}

	protected removePressAndHold(e): void {
		Tweener.removeTweens(this);
		if (this.pressAndHoldActivated) {
			this.pressAndHoldActivated = false;
		}
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
}