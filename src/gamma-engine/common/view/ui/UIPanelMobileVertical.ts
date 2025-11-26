import { BlurFilter, Container, Graphics, Matrix, Sprite, Text, Texture } from 'pixi.js';
import LayoutElement from '../../../core/view/model/LayoutElement';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import Button from '../../../core/view/ui/Button';
import ControlEvent from '../../../core/control/event/ControlEvent';
import Wallet from '../../../slots/model/Wallet';
import SlotMachine from '../../../slots/model/SlotMachine';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';
import { container } from 'tsyringe';
import SoundManager from '../../../core/sound/SoundManager';
import ValueText from '../../../core/view/text/ValueText';
import { UIPanelEvent } from '../../control/event/UIPanelEvent';
import UISettingsMobileVertical from './UISettingsMobileVertical';
import UIState, { UIPanelType } from '../../model/UIState';
import { UIStateEvent } from '../../model/event/UIStateEvent';
import AssetsManager from '../../../core/assets/AssetsManager';
import UIMain from './UIMain';
import ButtonSpin from '../ButtonSpin';
import SoundList from '../../sound/SoundList';
import { UIPanellConfiguration } from '../../model/UIPanelConfiguration';
import AdjustableLayoutContainer from '../../../core/view/AdjustableLayoutContainer';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import BalanceInfo from '../../model/BalanceInfo';
import { DoubleChanceButton } from './DoubleChanceButton';
import { CascadeHistoryView } from './CascadeHistoryView';
import { FreeSpinButton } from './FreeSpinButton';
import { SlotMachineState } from '../../../slots/model/SlotMachineState';
import StatusComponent from './StatusComponent';
import ICommonGameService from '../../services/ICommonGameService';
import MultiplierFrame from '../MultiplierFrame';
import { Tweener } from '../../../core/tweener/engineTween';
import { WalletEvent } from '../../../slots/model/event/WalletEvent';
import MainGameScreen from '../../../../drunkie-monkey/view/MainGameScreen';
import GraphicUtils from '../../../slots/utils/GraphicUtils';

export default class UIPanelMobileVertical extends AdjustableLayoutContainer {
    private baseYPositions: {
        brandWatermark: number,
        balance: number,
        btnBet: number,
        btnWin: number,
        background: number,
        tfHoldSpinButton: number
    }

    private wallet: Wallet;
    private slotMachine: SlotMachine;
    private btnBet: Button;
    private btnWin: Button;
    private balance;
    private _config: UIPanellConfiguration;

    // VISUALS
    public cascadeHistoryPanelMobile: CascadeHistoryView;
    public btnFreeSpin: FreeSpinButton
    public multiplierFrameMobile: MultiplierFrame
    public statusComponent: StatusComponent

    private uiSettings: UISettingsMobileVertical;
    private uiMain: UIMain;

    private btnDoubleChance?: DoubleChanceButton;


    private tfBalance: ValueText;
    private tfBet: Text;
    private tfWin: Text;
    private tfCredit: Text;
    private tfBalanceSeperator: Text;
    private tfBetSeperator: Text;
    private tfTotalBet: Text;



    private uiPosition

    // private btnBet: Button;
    //private btnWin: Button;

    private brandWatermark: Sprite;
    private background: Graphics;
    private mainGameScreen: MainGameScreen
    protected blurBg: Sprite;
    public tfHoldSpinButton: Text;


    constructor(config: UIPanellConfiguration, mainGame: MainGameScreen) {
        super(AssetsManager.layouts.get('UIPanelMobileVertical'));

        this._config = config;
        this.mainGameScreen = mainGame;

        LayoutBuilder.create(this.layout, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });


        this.uiPosition = 0
        this.tfBet = this.btnBet['text'];
        this.tfWin = this.btnWin['text'];
        this.tfWin.style.fontWeight = 'bolder';
        this.tfBalance = this['balance'].text;

        this.tfBalanceSeperator = this.balance['seperator'];
        this.tfCredit = this.balance['credit'];

        this.tfBetSeperator = this.btnBet['seperator'];
        this.tfTotalBet = this.btnBet['totalBet'];

        this.tfBalanceSeperator.x = this.tfCredit.x + this.tfCredit.width;
        this.tfBalance.x = this.tfBalanceSeperator.x + this.tfBalanceSeperator.width;

        this.tfBetSeperator.x = this.tfTotalBet.x + this.tfTotalBet.width;
        this.tfBet.x = this.tfBetSeperator.x + this.tfBetSeperator.width;
        //
        // this.tfBalance = this.balanceInfo.tfCredit;
        // this.tfBet = this.balanceInfo.tfBet;
        this.wallet = container.resolve(Wallet);
        this.slotMachine = container.resolve(SlotMachine);
        this.tfWin.text = `${this.wallet.getCurrencyValue(this.slotMachine.roundResult.nextType === 10 ? this.slotMachine.roundResult?.totalWinValue : 0, true)}`;
        this.statusComponent.visible = false
        this.wallet.on(WalletEvent.COIN_VALUE_CHANGED, this.onBetValueChanged, this);
        this.wallet.on(WalletEvent.BALANCE_CHANGED, this.onWalletBalanceChanged, this);
        this.onWalletBalanceChanged();

        this.slotMachine.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
        this.onBetValueChanged();
        this.slotMachine.on(SlotMachineEvent.STATE_CHANGED, this.onSlotMachineStateChanged, this);
        const uiState = container.resolve(UIState);
        uiState.on(UIStateEvent.SETTINGS_OPEN_CHANGED, this.onUiSettingsOpenChange, this);
        this.onUiSettingsOpenChange();
        this.statusComponent.winValue = 0
        this.statusComponent.visible = false

        this.baseYPositions = {
            brandWatermark: this.brandWatermark.position.y,
            balance: this.balance.position.y,
            btnWin: this.btnWin.position.y,
            btnBet: this.btnBet.position.y,
            background: this.background.position.y,
            tfHoldSpinButton: this.tfHoldSpinButton.position.y,
        }


        //this.winValue = 0;
    }

    // PUBLIC API
    public lock(bonusRoundActive: boolean = false): void {
        this.uiMain.lock(bonusRoundActive);
        this.btnFreeSpin.enabled=false;

        new ControlEvent(UIPanelEvent.CLOSE_SETTINGS).dispatch();
    }

    public unlock(bonusRoundActive: boolean = false): void {
        this.uiMain.unlock(bonusRoundActive);
        this.btnFreeSpin.enabled=true;
    }

    public set winValue(value: number | string) {
        if(typeof value == "number")
            this.tfWin.text = `${this.wallet.getCurrencyValue(value, true)}`;

    }

    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        this.background.width = desc.currentWidth;
        this.background.x = -(desc.currentWidth - desc.baseWidth) / 2;

        if (desc.baseWidth < desc.currentWidth) {
            this.uiMain.y = this.background.y = this.statusComponent.y = this.uiSettings.y = 0
        } else {
            this.uiPosition = this.uiMain.y = this.background.y = this.statusComponent.y = this.uiSettings.y = (desc.currentHeight - desc.baseHeight) / 2
        }

        let bottomY: number = desc.baseHeight;
        if (desc.currentHeight > desc.baseHeight) {
            bottomY = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
        }
        this.balance.y = bottomY - (desc.baseHeight - this.baseYPositions.balance);
        this.btnWin.y = bottomY - (desc.baseHeight - this.baseYPositions.btnWin);
        this.btnBet.y = bottomY - (desc.baseHeight - this.baseYPositions.btnBet);
        this.brandWatermark.y = bottomY - (desc.baseHeight - this.baseYPositions.brandWatermark);
        this.background.y = bottomY - (desc.baseHeight - this.baseYPositions.background);
        this.tfHoldSpinButton.y = bottomY - (desc.baseHeight - this.baseYPositions.tfHoldSpinButton);
        this.updateBlurBg(desc);
    }

    public updateBlurBg(desc: UpdateLayoutDescription): void {
		const blurFilter: BlurFilter = new BlurFilter();
		blurFilter.blur = 20;
		blurFilter.quality = 10;

		const matrix = new Matrix();
		matrix.translate((desc.currentWidth - desc.baseWidth) / 2, -(desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2 - this.background.height));

		this.blurBg && this.blurBg.destroy(true);
		this.visible = false;
		const texture: Texture = GraphicUtils.generateFilteredTextureFromContainer(this.mainGameScreen, this.background.width, this.background.height, matrix, [blurFilter]);
		this.blurBg = new Sprite(texture);
        this.blurBg.name = "blurBackground";
        this.blurBg.pivot = this.background.pivot;
        this.blurBg.position = this.background.position;

		this.addChildAt(this.blurBg, 0);
		this.visible = true;
	}




    // PRIVATE API
    public onSlotMachineStateChanged(currentState: SlotMachineState): void {
        const sm: SlotMachine = this.slotMachine;
        const wallet: Wallet = container.resolve(Wallet);
        const gs: ICommonGameService = container.resolve<ICommonGameService>('GameService');

        switch (currentState) {
            case SlotMachineState.SPINNING:
                this.statusComponent.winValue = 0
                break;
            case SlotMachineState.SPIN_END:
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
                // this.multiplierFrameMobile.value = this.slotMachine.currentSpinResult.totalWinMultiplier;
                break;
            case SlotMachineState.FREE_SPINS:
                break;
            case SlotMachineState.FREE_SPINS_ROUND_END:
                break;
            case SlotMachineState.IDLE:
                this.hideMultiplierFrame();
                this.multiplierFrameMobile.value = 0;
                this.statusComponent.winValue = 0
                break;
        }
    }
    private showMultiplierFrame(): void {
        if(this.btnDoubleChance) {
            Tweener.addTween(this.btnDoubleChance, {
                alpha: 0,
                time: 1,
                onComplete: () => {
                    this.btnDoubleChance.visible = false
                },
            });
        }

        Tweener.addTween(this.multiplierFrameMobile, {
            alpha: 1,
            time: 2,
            delay: 0.6,
            onStart: () => {
                this.multiplierFrameMobile.visible = true;
            }
        });

    }

    private hideMultiplierFrame(): void {
        const offsetYMobile: number = 24;
        Tweener.addTween(this.multiplierFrameMobile, {
            alpha: 0,
            time: 1,
            onComplete: () => {
                this.multiplierFrameMobile.visible = false;
            }
        });

        if(this.btnDoubleChance) {
            this.btnDoubleChance.visible = true
            Tweener.addTween(this.btnDoubleChance, {
                alpha: 1,
                time: 1
            });
        }
    }
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                break;
            case 'ButtonSpin':
                instance = new ButtonSpin(le);
                break;
            case 'ValueText':
                instance = new ValueText(le);
                break;
            case 'UIMain':
                instance = new UIMain(le, this._config.UIMainConfiguration,this.mainGameScreen);
                break;

            case 'FreeSpinButton':
                instance = new FreeSpinButton(le);
                break;
            case 'DoubleChanceButton':
                instance = new DoubleChanceButton(le);
                break;
            case 'MultiplierFrameMobile':
                instance = new MultiplierFrame(le, true);
                break
            case 'CascadeHistoryPanelMobile':
                instance = new CascadeHistoryView(le);
                break
            case 'UISettings':
                instance = new UISettingsMobileVertical(le);
                break;
            case 'StatusComponent':
                instance = new StatusComponent(le, 24);
                break;
        }

        return instance;
    }

    private onUiSettingsOpenChange(): void {

        const uiState = container.resolve(UIState);
        if (uiState.settingsOpen) {
            this.animateUiOut(this.uiMain, this.uiMain.btnMenu);
            this.animateUiIn(this.uiSettings, this.uiSettings.btnClose);
        } else {
            this.animateUiIn(this.uiMain, this.uiMain.btnMenu);
            this.animateUiOut(this.uiSettings, this.uiSettings.btnClose);
        }
    }

    private onWalletBalanceChanged(): void {
        this.tfBalance.renderValueFunction = (tf, value) => {
            tf.text = `${this.wallet.getCurrencyValue(value,true)}`;
        }

        //To fix the issue when previous tween is not finished yet
        if (Tweener.isTweening(this.tfBalance)) {
            Tweener.removeTweens(this.tfBalance);
            this.tfBalance.value = this.wallet.balance;
            this.balance.pivot.x = this.balance.width / 2;
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
        this.balance.pivot.x = this.balance.width / 2;
    }

    private onBetValueChanged(): void {
        this.tfBet.text = `${this.wallet.getCurrencyValue(this.slotMachine.totalBet * this.wallet.coinValue * Wallet.denomination,true)}`;
        this.animateText(this.tfBet);
        this.btnBet.pivot.x = this.btnBet.width / 2;
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


    private animateUiIn(uiPanel: Container, btnToUnblock) {
        Tweener.addTween(uiPanel, {
            alpha: 1,
            time: 0.25,
            transition: 'easeInOutQuart',
            onStart: () => {
                uiPanel.visible = true;
            },
            onComplete: () => {
                btnToUnblock.enabled = true
            }
        });
    }

    private animateUiOut(uiPanel: Container, btnToBlock) {
        Tweener.addTween(uiPanel, {
            y: uiPanel.y + uiPanel.height,
            alpha: 0,
            time: 0.15,
            transition: 'easeInSine',
            onStart: () => {
                btnToBlock.enabled = false
            },
            onComplete: () => {
                uiPanel.visible = false;
                uiPanel.y = this.background.y

            }
        });
    }


    // USER INTERACTION
    private onBtnBet(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.BET_SETTINGS).dispatch();
    }

    private onBtnWin(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.OPEN_PANEL, UIPanelType.HISTORY).dispatch();
    }
    public getUIMain() {
        return this.uiMain
    }

}