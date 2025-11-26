import {Container, DisplayObject, Graphics, Sprite, Text} from 'pixi.js';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import AssetsManager from '../../../core/assets/AssetsManager';
import { SymbolData } from '../../../slots/view/SymbolData';
import { container } from 'tsyringe';
import SlotMachine from '../../../slots/model/SlotMachine';
import Wallet from "../../../slots/model/Wallet";
import {SlotMachineEvent} from "../../../slots/model/event/SlotMachineEvent";
import {WalletEvent} from "../../../slots/model/event/WalletEvent";
import {autoscaleText} from "../../../core/utils/Utils";
import LayoutElement from "../../../core/view/model/LayoutElement";

type PaytableSymbolCellConfig = {
    setMultipliers: boolean,
    maxFontSize: number,
    maxWidth: number,
    maxHeight: number
}

export default class PaytableSymbolCell extends Container {

    private symbolId: number;

    private tfPays15:Text;
    private tfPays14:Text;
    private tfPays13:Text;
    private tfPays12:Text;
    private tfPays11:Text;
    private tfPays10:Text;
    private tfPays9:Text;
    private tfPays8:Text;
    private tfPays7:Text;
    private tfPays6:Text;
    private tfPays5:Text;

    private symbolArea: Graphics;
    private staticIcon: Container;

    private multiplierDescription: Container;
    private slotMachine:SlotMachine
    private wallet:Wallet

    private defaultMaxSize: number;


    private config: PaytableSymbolCellConfig = {
        setMultipliers: true,
        maxFontSize: 20,
        maxHeight: 60,
        maxWidth: 120
    };
    constructor(le: LayoutElement, symbolData: SymbolData, config: PaytableSymbolCellConfig = null) {
        super();

        LayoutBuilder.create(le, this);

        if(config)
            this.config = config;

        this.symbolId = symbolData.id;
        this.wallet = container.resolve(Wallet)
        this.slotMachine = container.resolve(SlotMachine)
        this.slotMachine.on(SlotMachineEvent.BET_VALUE_CHANGED, () =>{this.setMultipliers(this.symbolId)}, this);

        this.wallet.on(WalletEvent.COIN_VALUE_CHANGED,() =>{this.setMultipliers(this.symbolId)}, this);

        this.symbolArea.visible = false;

        const staticIcon: Sprite = new Sprite(symbolData.staticIcon.texture);
        staticIcon.anchor.set(0.5, 0.5);
        this.staticIcon.addChild(staticIcon);

        this.tfPays15 = this['multiplierDescription']['tfPays15'];
        this.tfPays14 = this['multiplierDescription']['tfPays14'];
        this.tfPays13 = this['multiplierDescription']['tfPays13'];
        this.tfPays12 = this['multiplierDescription']['tfPays12'];
        this.tfPays11 = this['multiplierDescription']['tfPays11'];
        this.tfPays10 = this['multiplierDescription']['tfPays10'];
        this.tfPays9 = this['multiplierDescription']['tfPays9'];
        this.tfPays8 = this['multiplierDescription']['tfPays8'];
        this.tfPays7 = this['multiplierDescription']['tfPays7'];
        this.tfPays6 = this['multiplierDescription']['tfPays6'];
        this.tfPays5 = this['multiplierDescription']['tfPays5'];

        if (this.config.setMultipliers)
            this.setMultipliers(symbolData.id);
        else
            this.multiplierDescription.visible = false;
    }

    private updateView(maxWidth: number = null, texts: Text[] = null): void{
        // const texts: Text[] =  this['multiplierDescription'].children as Text[];

        [this.tfPays5, this.tfPays6, this.tfPays7, this.tfPays8, this.tfPays9, this.tfPays10, this.tfPays11, this.tfPays12, this.tfPays13, this.tfPays14, this.tfPays15].forEach((text: Text) => {
            autoscaleText(text, this.config.maxFontSize, this.config.maxWidth, this.config.maxHeight);
        });

        const offset: number = 12;

        const totalWidth: number = maxWidth?maxWidth: this.width;

        for (let i = 0; i < 11; i++) {
            texts[i].x = (totalWidth- (texts[i].width+offset+texts[i+11].width)) /2;
            const posX = texts[i].x + texts[i].width + offset;
            texts[i+11].x = posX + texts[i+11].width;
        }
    }

    public get width(): number {
        return this.symbolArea.width;
    }

    public get height(): number {
        return this.symbolArea.height;
    }

    private setMultipliers(symbolId: number): void {
        const sm: SlotMachine = container.resolve(SlotMachine);

        if (symbolId > 100 && symbolId < 8000) {
            this.tfPays15.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 15).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays14.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 14).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays13.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 13).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays12.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 12).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays11.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 11).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays10.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 10).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays9.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 9).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays8.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 8).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays7.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 7).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays6.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 6).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;
            this.tfPays5.text = `${this.wallet.getCurrencyValue(sm.findRule(symbolId, 5).reward.line.multiplier * container.resolve(SlotMachine).totalBet * container.resolve(Wallet).coinValue)}`;

            this.updateView(this.width, this['multiplierDescription'].children as Text[]);
        }

    }
}
