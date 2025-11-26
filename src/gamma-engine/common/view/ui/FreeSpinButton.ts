import Button from '../../../core/view/ui/Button';
import LayoutElement from '../../../core/view/model/LayoutElement';
import { Graphics, Text } from 'pixi.js';
import { container } from 'tsyringe';
import Wallet from '../../../slots/model/Wallet';
import { PopupData, PopupType } from '../../model/PopupState';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { UIPanelEvent } from '../../control/event/UIPanelEvent';
import SlotMachine from '../../../slots/model/SlotMachine';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';
import { WalletEvent } from '../../../slots/model/event/WalletEvent';
import { SlotMachineState } from '../../../slots/model/SlotMachineState';
// import Translation from '../../../core/translations/Translation';
import ICommonGameService from '../../services/ICommonGameService';
import EventEmitter from 'eventemitter3'
import { GameServiceEvent } from '../../../../drunkie-monkey/services/event/GameServiceEvent';
import { autoscaleText } from '../../../core/utils/Utils';
import GameService from '../../../../drunkie-monkey/services/GameService';
import AssetsManager from '../../../core/assets/AssetsManager';

export class FreeSpinButton extends Button {

    private tfTitle: Text;
    private tfValue: Text;
    //private area: Graphics;

    constructor(le: LayoutElement) {
        super(le);

        this.tfTitle = this.normal['tfTitle'];
        this.tfValue = this.normal['tfValue'];
        //this.area = this.normal['area'];
        //this.area.visible = false;

        this.tfTitle.style.align = 'center';

        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);
        const gs: GameService = container.resolve<GameService>('GameService')

        sm.on(SlotMachineEvent.STATE_CHANGED, this.onSlotMachineStateChanged, this);

        sm.on(SlotMachineEvent.BET_VALUE_CHANGED, () => {
            this.setTexts(AssetsManager.translations.get('freeSpins.buy'), wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true));
        }, this);

        wallet.on(WalletEvent.COIN_VALUE_CHANGED, () => {
            this.setTexts(AssetsManager.translations.get('freeSpins.buy'), wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true));
        }, this);

        gs.on(GameServiceEvent.DOUBLE_CHANCE_CHANGED, ()=>{
            this.enabled = !gs.doubleUpChance;
            this.alpha = this.enabled? 1: 0.4;
        }, this);

        this.on('pointerup', this.onClick, this);

        // At this point SlotMachine, Wallet and GameService are fully initialized and contains valid data to be displayed
        this.setTexts(AssetsManager.translations.get('freeSpins.buy'), wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true));
    }

    private onSlotMachineStateChanged(currentState: SlotMachineState): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);
        const gs: ICommonGameService = container.resolve<ICommonGameService>('GameService')

        switch (currentState) {
            case SlotMachineState.SPIN_RESULT_FREE_SPINS:
                this.setTexts(AssetsManager.translations.get('freeSpins.left'), sm.currentSpinResult.freespins.totalCount.toString(), false, true);
                break;
            case SlotMachineState.FREE_SPINS_ROUND_START:
                this.setTexts(AssetsManager.translations.get('freeSpins.left'), (sm.currentSpinResult.freespins.remainingCount).toString(), false, true);
                break
            case SlotMachineState.FREE_SPINS:
                this.setTexts(AssetsManager.translations.get('freeSpins.left'), (sm.currentSpinResult.freespins.remainingCount - 1).toString(), false);
                break;
            case SlotMachineState.IDLE:
                this.setTexts(AssetsManager.translations.get('freeSpins.buy'), wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true), true, true);
                break;
            case SlotMachineState.FREE_SPINS_ROUND_END:
                this.setTexts(AssetsManager.translations.get('freeSpins.buy'), wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true), false, true);
                break;
        }
    }

    private onClick(): void {
        const data: PopupData = {
            type: PopupType.FEATURE_BUY,
            hideOnClick: false,
            duration: -1,
            callbacks: null
        }
        new ControlEvent(UIPanelEvent.SHOW_POPUP, data).dispatch();
    }

    public setTexts(title: string, value: string, isActive: boolean = true, isNotAlpha: boolean = true): void {
        this.tfTitle.text = title;
        this.tfValue.text = value;

        autoscaleText(this.tfTitle, 32, 218, 100)
        autoscaleText(this.tfValue, 54, 190, 65);

        this.setActive(isActive);

        // isNotAlpha ? this.alpha = 1 : this.alpha = 0.4
    }

    private setActive(isActive: boolean): void {
        this.enabled = isActive;
    }
}
