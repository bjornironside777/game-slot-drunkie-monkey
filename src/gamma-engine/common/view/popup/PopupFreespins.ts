import { BitmapText, Container, Sprite, Text, TextStyle } from 'pixi.js';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import AssetsManager from '../../../core/assets/AssetsManager';
import { Spine } from 'pixi-spine';
import LayoutElement from '../../../core/view/model/LayoutElement';
import Sound from '../../../core/sound/Sound';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';
import { container } from 'tsyringe';
import Wallet from '../../../slots/model/Wallet';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { autoscaleText } from '../../../core/utils/Utils';
import {FreeSpinsAnimation} from './PopupFreeSpinAnimationType';

export default class PopupFreespins extends Container {
    // VISUALS
    public animation: Spine;
    public tfAmount: Text;
    public tfFreeSpinNumber: Text
    public orientation: ScreenOrientation;
    private freespinEndvalue: boolean;
    private youHaveWonText: Text;
    private freeSpin: Text;
    private pressAnywhereText: Text;

    private freeSpinsAnimations: {
    BUY_FREE_SPINS1_IN : string,
    BUY_FREE_SPINS1_LOOP : string,
    BUY_FREE_SPINS1_OUT : string,

    BUY_FREE_SPINS2_IN : string,
    BUY_FREE_SPINS2_IN_MOBILE : string,
    BUY_FREE_SPINS2_LOOP : string,
    BUY_FREE_SPINS2_LOOP_MOBILE : string,
    BUY_FREE_SPINS2_OUT : string,
    BUY_FREE_SPINS2_OUT_MOBILE : string,

    BUY_FREE_SPINS3_IN : string,
    BUY_FREE_SPINS3_IN_MOBILE : string,
    BUY_FREE_SPINS3_LOOP : string,
    BUY_FREE_SPINS3_LOOP_MOBILE : string,
    BUY_FREE_SPINS3_OUT : string,
    BUY_FREE_SPINS3_OUT_MOBILE : string,
    };

    constructor(private lang: string, private amount: number | (() => number),orientation: ScreenOrientation,totalFreespinCount:number = 0, isoCode: string = '', freeSpinEnd: boolean = false, totalFreespin: boolean = true) {
        super();
        this.orientation = orientation;

        this.freespinEndvalue=freeSpinEnd;

        LayoutBuilder.create(AssetsManager.layouts.get('PopupFreespins'), this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });
        this.freeSpinsAnimations = FreeSpinsAnimation[this.lang]
        const wallet: Wallet = container.resolve(Wallet);
        const amt = (amount instanceof Function ? amount() : amount);
        const style = new TextStyle({
            fontFamily: AssetsManager.webFonts.get('SairaStencilOne').family,
            fill: ["#ffe614"],
            fontSize: 150,
            stroke: '#410456',
            strokeThickness: 14,
            lineJoin: 'round',
        })
        this.tfAmount = new Text(wallet.getCurrencyValue(amt, false), style);
        this.tfAmount.anchor.set(0.5, 0.5);
        this.tfAmount.scale.set(1, -1);
        autoscaleText(this.tfAmount,150,300,150)
        this.tfAmount.y = -5

        if (freeSpinEnd) {
            this.tfFreeSpinNumber = new Text(`${AssetsManager.translations.get('freeSpins.in')}${totalFreespinCount} ${AssetsManager.translations.get('freeSpins.freeSpinEnd')}`, {
                fontFamily: AssetsManager.webFonts.get('SairaStencilOne').family,
                fill: ["#4ad5ff"],
                fontSize: 74,
                lineJoin: 'round',
            })

            this.tfFreeSpinNumber.anchor.set(0.5, 0.5);
            this.tfFreeSpinNumber.scale.set(1, -1)
            autoscaleText(this.tfFreeSpinNumber,75,600,150)
        }

        const style2 = new TextStyle({
            fontFamily: AssetsManager.webFonts.get('SairaStencilOne').family,
            fill: ["#4ad5ff"],
            fontSize: 74,
            lineJoin: 'round',
        })
        this.youHaveWonText = new Text(AssetsManager.translations.get('freeSpins.youHaveWon'), style2);

        if(!totalFreespin)
            this.youHaveWonText.text = AssetsManager.translations.get('freeSpins.youHaveLeft')
        this.freeSpin = new Text(AssetsManager.translations.get('freeSpins.freeSpin'), style2);
        this.freeSpin.anchor.set(0.5);
        this.freeSpin.scale.set(1, -1);
        this.youHaveWonText.anchor.set(0.5);
        this.youHaveWonText.scale.set(1, -1);

        this.pressAnywhereText = new Text(AssetsManager.translations.get('freeSpins.pressAny'), {
            fontFamily: AssetsManager.webFonts.get('SairaStencilOne').family,
            fill: ["white"],
            fontSize: 25,
        });
        this.pressAnywhereText.anchor.set(0.5,-1.5);
        this.pressAnywhereText.scale.set(1, -1);

        this.animation = new Spine(AssetsManager.spine.get('freegame_anim'))
        this.addChild(this.animation)


        let counterContainer: Container;
        counterContainer = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder2')];
        if (freeSpinEnd){
            const amount = new Text(wallet.getCurrencyValue(amt, true),style);
            counterContainer.addChild(amount);
            amount.anchor.set(0.5, 0.5);
            amount.scale.set(1, -1);
            autoscaleText(amount,150,500,150)

            if(AssetsManager.translations.get('freeSpins.in') == ''){
                const youHaveWonContainer: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder_5')];
                youHaveWonContainer.removeChildren();
                youHaveWonContainer.addChild(this.youHaveWonText);
                const inFreeSpinContainer2: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder4')];
                inFreeSpinContainer2.removeChildren();
                inFreeSpinContainer2.addChild(this.tfFreeSpinNumber);
            }else{
                const youHaveWonContainer: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder4')];
                youHaveWonContainer.removeChildren();
                youHaveWonContainer.addChild(this.youHaveWonText);
                const inFreeSpinContainer2: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder_5')];
                inFreeSpinContainer2.removeChildren();
                inFreeSpinContainer2.addChild(this.tfFreeSpinNumber);
            }
        }
        else{
            const youHaveWonContainer: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder4')];
            youHaveWonContainer.addChild(this.youHaveWonText);
            const freeSpinContainer: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('free spin')];
            freeSpinContainer.addChild(this.freeSpin);
            counterContainer.addChild(this.tfAmount);
        }
        const pressAnyWhereContainer: Container = this.animation.slotContainers[this.animation.skeleton.findSlotIndex('placeholder5')];
        pressAnyWhereContainer.addChild(this.pressAnywhereText);


        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    public updateLayout(desc:UpdateLayoutDescription){
        // this.animation.state.setEmptyAnimations(4);
        if(desc.orientation==ScreenOrientation.HORIZONTAL){
            this.animation.x=0;
            this.animation.state.setAnimation(0,this.freeSpinsAnimations.BUY_FREE_SPINS2_LOOP, true);
            if(this.freespinEndvalue){
                this.animation.state.setAnimation(0,this.freeSpinsAnimations.BUY_FREE_SPINS3_LOOP, true);
            }
        }else{
            this.animation.x=20;
            this.animation.state.setAnimation(0,this.freeSpinsAnimations.BUY_FREE_SPINS2_LOOP_MOBILE, true);
            if(this.freespinEndvalue){
                this.animation.state.setAnimation(0,this.freeSpinsAnimations.BUY_FREE_SPINS3_LOOP_MOBILE, true);
            }
        }

    }
    // PRIVATE API
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'FreespinsAnimation':
                instance = new Spine(AssetsManager.spine.get('freegame_anim'));
                break;
        }

        return instance;
    }

    private onAdded(): void {
        this.animation.state.setEmptyAnimations(0);
        if (this.freespinEndvalue) {
            // this.animation.state.setAnimation(0, this.orientation==ScreenOrientation.HORIZONTAL ? 'buy_free_spins_in' : 'buy_free_spins3_in_mobile', false);
            this.animation.state.addAnimation(0, this.orientation==ScreenOrientation.HORIZONTAL ? this.freeSpinsAnimations.BUY_FREE_SPINS3_LOOP : this.freeSpinsAnimations.BUY_FREE_SPINS3_LOOP_MOBILE, true, 0);
        }else{
            this.animation.state.setAnimation(0, this.orientation==ScreenOrientation.HORIZONTAL ? this.freeSpinsAnimations.BUY_FREE_SPINS2_IN : this.freeSpinsAnimations.BUY_FREE_SPINS2_IN_MOBILE, false);
            this.animation.state.addAnimation(0, this.orientation==ScreenOrientation.HORIZONTAL ? this.freeSpinsAnimations.BUY_FREE_SPINS2_LOOP : 'buy_free_spins2_loop_mobile', true, 0);
        }
    }

    private onRemoved(): void {
        this.animation.state.setAnimation(0, this.freeSpinsAnimations.BUY_FREE_SPINS2_OUT, false);
        // this.animation.state.setEmptyAnimations(0);
        this.animation.state.clearListeners();
        this.animation['lastTime'] = null;
    }
}
