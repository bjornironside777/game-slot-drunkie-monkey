import { Container, Text } from "pixi.js";
import { container } from "tsyringe";
// import Translation from "../../../core/translations/Translation";
import { Tweener } from "../../../core/tweener/engineTween";
import LayoutBuilder from "../../../core/utils/LayoutBuilder";
import LayoutElement from "../../../core/view/model/LayoutElement";
import ValueText from "../../../core/view/text/ValueText";
import { UpdateLayoutDescription } from "../../../core/view/UpdateLayoutDescription";
import Wallet from "../../../slots/model/Wallet";
import AssetsManager from "../../../core/assets/AssetsManager";
import { ScreenOrientation } from "../../../core/view/ScreenOrientation";

export default class BonusGameStatusBar extends Container {

    private isActive = false;
    private tfRemaining: Text;
    private tfWinValue: ValueText;

    constructor(le: LayoutElement) {
        super();

        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    // PRIVATE API
    private onAdded(): void {
        // this.setWinValue(0);
    }

    private onRemoved(): void {

    }

    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'ValueText':
                instance = new ValueText(le);
                break;
        }

        return instance;
    }

    public updateLayout(desc: UpdateLayoutDescription) {
        if(desc.orientation === ScreenOrientation.HORIZONTAL)    this.scale.set(desc.currentHeight / desc.baseHeight);
        this.y = this.isActive ? (desc.baseHeight - desc.currentHeight) / 2 : (desc.baseHeight - desc.currentHeight) / 2 - this.height;
    }

    public setWinValue(value: number): void {
        const wallet = container.resolve(Wallet);
        this.tfWinValue.renderValueFunction = (tf, value) => {
            tf.text = `${wallet.getCurrencyValue(value, true)}`;
        }

        //To fix the issue when previous tween is not finished yet
        if (Tweener.isTweening(this.tfWinValue)) {
            Tweener.removeTweens(this.tfWinValue);
            this.tfWinValue.value = wallet.balance;
            return;
        }

        // check if ui present on stage and balance increased
        if (this.parent && (value > this.tfWinValue.value)) {
            this.tfWinValue.setValue(value, {
                countUpDuration: 1
            });
        } else {
            this.tfWinValue.value = value;
        }
    }

    public setRemainingCount(value: number): void {
        this.tfRemaining.text = `${AssetsManager.translations.get('bonusSpins.tfRemaining')} ${value}`;
    }

    public showStatusBar(): void {
        this.alpha = 1;
        Tweener.addTween(this, {
            y: this.y + this.height,
            time: 0.4,
            transition: 'easeInOutQuart',
            onComplete: () => {
                this.isActive = true;
            }
        });
    }

    public hideStatusBar(): void {
        Tweener.addTween(this, {
            y: this.y - this.height,
            time: 0.4,
            transition: 'easeInOutQuart',
            onComplete: () => {
                this.alpha = 0;
                this.isActive = false;
            }
        });
    }
}
