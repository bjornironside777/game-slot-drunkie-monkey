import AssetsManager from '../../../core/assets/AssetsManager';
import {Container, Text} from 'pixi.js';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import LayoutElement from '../../../core/view/model/LayoutElement';
import Button from '../../../core/view/ui/Button';
import ControlEvent from '../../../core/control/event/ControlEvent';
import {UIPanelEvent} from '../../control/event/UIPanelEvent';
import {SlotGameEventExtension} from "../../../../drunkie-monkey/control/event/SlotGameEventExtension";
import {autoscaleText} from "../../../core/utils/Utils";
import GameService from "../../../../drunkie-monkey/services/GameService";
import {container} from "tsyringe";
import Wallet from "../../../slots/model/Wallet";
import SlotMachine from "../../../slots/model/SlotMachine";
import { WalletEvent } from '../../../slots/model/event/WalletEvent';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';

export default class PopupFeatureBuy extends Container {

    private tfMainText: Text;
    private tfAmount: Text;
    private tfFreespins:Text;

    private btnStart:Button;
    private btnCancel:Button;
    constructor() {
        super();
        LayoutBuilder.create(AssetsManager.layouts.get('PopupFeatureBuy'), this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        if(this['tfMainText']) {
            this['tfMainText'].style.align = 'center';
        }

        this.tfFreespins.style.align = 'center';

        autoscaleText(this.tfFreespins, this.tfFreespins.style.fontSize as number, 537, 244.5);

        const gs: GameService = container.resolve<GameService>('GameService')
        const wallet: Wallet = container.resolve(Wallet);
        const sm: SlotMachine = container.resolve(SlotMachine);
        sm.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
        this.tfAmount.text = wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true);
        autoscaleText(this.tfAmount, this.tfAmount.style.fontSize as number, 537,140);
        this.btnStart.on('pointerup', this.onBtnStart, false)
        this.btnCancel.on('pointerup', this.onBtnCancel, false)
        this.on('added', this.onAdded, this);
    }
    private onAdded(){
        const gs: GameService = container.resolve<GameService>('GameService')
        const wallet: Wallet = container.resolve(Wallet);
        const sm: SlotMachine = container.resolve(SlotMachine);
        this.tfAmount.text = wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true);

        autoscaleText(this.tfAmount, this.tfAmount.style.fontSize as number, 537,140);
    }

    public onBetValueChanged() {
        const wallet: Wallet = container.resolve(Wallet);
        const sm: SlotMachine = container.resolve(SlotMachine);
        const gs: GameService = container.resolve<GameService>('GameService')
        this.tfAmount.text = wallet.getCurrencyValue(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue, true);
    }


    protected customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                break;
        }
        return instance;
    }


    private onBtnStart():void{
        new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
        new ControlEvent(SlotGameEventExtension.BUY_FREESPINS).dispatch();
    }

    private onBtnCancel():void{
        new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
    }
}
