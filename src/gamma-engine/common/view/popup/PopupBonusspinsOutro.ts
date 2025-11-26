import { Container, Text } from "pixi.js";
import { container } from "tsyringe";
import ControlEvent from "../../../core/control/event/ControlEvent";
import SoundManager from "../../../core/sound/SoundManager";
import LayoutBuilder from "../../../core/utils/LayoutBuilder";
import LayoutElement from "../../../core/view/model/LayoutElement";
import Button from "../../../core/view/ui/Button";
import Wallet from "../../../slots/model/Wallet";
import { UIPanelEvent } from "../../control/event/UIPanelEvent";
import SoundList from "../../sound/SoundList";

export default class PopupBonusspinsOutro extends Container {

    private tfWinAmount: Text;
    private tfBonusCompleted: Text;
    private btnClose: Button;
    private btnContinue: Button;

    constructor(le: LayoutElement, private winAmount: number | (() => number)) {
        super();
        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });


        this.btnClose.on('pointerup', this.onBtnClose, this);
        this.btnContinue.on('pointerup', this.onBtnClose, this);

        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    // PRIVATE API
    private onAdded(): void {
        const winAmt = (this.winAmount instanceof Function ? this.winAmount() : this.winAmount);
        const wallet: Wallet = container.resolve(Wallet);

        this.tfBonusCompleted.style.align = "center";
        this.tfWinAmount.text = wallet.getCurrencyValue(winAmt, true);
    }

    private onRemoved(): void {

    }

    private onBtnClose(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
    }

    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                break;
        }

        return instance;
    }
}