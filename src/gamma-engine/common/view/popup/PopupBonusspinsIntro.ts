import { Container, Text } from "pixi.js";
import ControlEvent from "../../../core/control/event/ControlEvent";
import SoundManager from "../../../core/sound/SoundManager";
// import Translation from "../../../core/translations/Translation";
import LayoutBuilder from "../../../core/utils/LayoutBuilder";
import LayoutElement from "../../../core/view/model/LayoutElement";
import { SlotGameEvent } from "../../../slots/control/event/SlotGameEvent";
import { UIPanelEvent } from "../../control/event/UIPanelEvent";
import SoundList from "../../sound/SoundList";
import Button from "../../../core/view/ui/Button";
import AssetsManager from "../../../core/assets/AssetsManager";

export default class PopupBonusspinsIntro extends Container {

    private tfBonusReceived: Text;
    private tfBonusMessage: Text;
    private tfExpiresInValue: Text;
    private btnClose: Button;
    private btnPlayLater: Button;
    private btnPlayNow: Button;

    constructor(
        le: LayoutElement,
        private spinsCount: number | (() => number),
        private expiration: { days: number; hours: number } | (() => { days: number; hours: number }),
        private disablePlayLater: boolean | (() => boolean)
    ) {
        super();
        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.btnClose.on('pointerup', this.onBtnClose, this);
        this.btnPlayLater.on('pointerup', this.onBtnClose, this);
        this.btnPlayNow.on('pointerup', this.onBtnPlayNow, this);

        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    // PRIVATE API
    private onAdded(): void {
        const numOfSpins = (this.spinsCount instanceof Function ? this.spinsCount() : this.spinsCount);
        const expiresIn = (this.expiration instanceof Function ? this.expiration() : this.expiration);
        const disablePlayLaterBtn = (this.disablePlayLater instanceof Function ? this.disablePlayLater() : this.disablePlayLater)

        if(disablePlayLaterBtn) {
            this.btnPlayLater.enabled = false;
            this.btnClose.visible = false;
            this.tfBonusReceived.text = `${AssetsManager.translations.get('bonusSpins.tfBonusLeft1')} ${numOfSpins}${AssetsManager.translations.get('bonusSpins.tfBonusLeft2')}`
            this.tfBonusMessage.visible = false;
        } else {
            this.btnPlayLater.enabled = true;
            this.btnClose.visible = true;
            this.tfBonusReceived.text = `${AssetsManager.translations.get('bonusSpins.tfBonusReceived1')} ${numOfSpins} ${AssetsManager.translations.get('bonusSpins.tfBonusReceived2')}`
            this.tfBonusMessage.visible = true;
        }
        this.tfBonusReceived.style.align = "center";
        this.tfBonusMessage.style.align = "center";
        this.tfExpiresInValue.text = this.expirationString(expiresIn.days, expiresIn.hours);
    }

    private onRemoved(): void {

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

    private onBtnClose(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
        new ControlEvent(SlotGameEvent.BONUS_GAME_WIN_REJECTED).dispatch();
    }

    private onBtnPlayNow(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
    }

    private expirationString(days: number, hours: number): string {
        const tfDays = days > 1 ? `${days} ${AssetsManager.translations.get('bonusSpins.tfDays')}` : `${days} ${AssetsManager.translations.get('bonusSpins.tfDay')}`;
        const tfHours = hours > 1 ? `${hours} ${AssetsManager.translations.get('bonusSpins.tfHours')}` : `${hours} ${AssetsManager.translations.get('bonusSpins.tfHour')}`;
        return `${tfDays}, ${tfHours}`;
    }
}
