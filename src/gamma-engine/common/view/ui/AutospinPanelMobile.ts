import {Slider, Input } from "@pixi/ui";
import { Graphics, Container, Text } from "pixi.js";
import { container } from "tsyringe";
import AssetsManager from "../../../core/assets/AssetsManager";
import ControlEvent from "../../../core/control/event/ControlEvent";
// import Translation from "../../../core/translations/Translation";
import LayoutElement from "../../../core/view/model/LayoutElement";
import { UpdateLayoutDescription } from "../../../core/view/UpdateLayoutDescription";
import { AutoplaySettings } from "../../../slots/model/Autoplay";
import SlotMachine from "../../../slots/model/SlotMachine";
import { SwitchEvent, SwitchState } from "./SwitchState";
import SwitchView from "./SwitchView";
import Button from "../../../core/view/ui/Button";
import Panel from "./Panel";
import { UIEvent } from "../../../slots/control/event/UIEvent";
import GameService from "../../../../drunkie-monkey/services/GameService";

export default class AutospinPanelMobile extends Panel {

    private btnConfirm: Button;
    private slotMachine: SlotMachine;
    private area: Graphics;
    private heading1On: Button;
    private heading1Off: Button;
    private heading2On: Button;
    private heading2Off: Button;
    private spinsNumber: number = 500;
    private gs: GameService;
    private slider: Slider;
    private turboSwitch: SwitchView;
    private skipScreenSwitch: SwitchView;
    private anyWinSwitch: SwitchView;
    private bonusWinSwitch: SwitchView;
    private btnConfirmTxt: Text;
    private inputSingleWin: Input;
    private inputIncreaseBy: Input;
    private inputDecreaseBy: Input;
    private tabViews: Container;
    private tab1: Container;
    private tab2: Container;

    constructor(le: LayoutElement) {
        super(le);
        this.slotMachine = container.resolve(SlotMachine);
        this.gs = container.resolve('GameService');
        
        this.tab1 = this.tabViews['tab1'];
        this.tab2 = this.tabViews['tab2'];
        this.turboSwitch = this.tab1['turboSwitch'];
        this.skipScreenSwitch = this.tab1['skipScreenSwitch'];
        this.slider = this.tab1['slider'];
        this.btnConfirmTxt = this.btnConfirm['normal']['tfConfirm'];
        this.inputSingleWin = this.tab2['inputSingleWin'];
        this.inputIncreaseBy = this.tab2['inputIncreaseBy'];
        this.inputDecreaseBy = this.tab2['inputDecreaseBy'];
        this.anyWinSwitch = this.tab2['anyWinSwitch'];
        this.bonusWinSwitch = this.tab2['bonusWinSwitch'];

        this.btnClose.scale.set(1.4);
        this.slider.onUpdate.connect((value) => {
            if(value < 5)
                value = 5;
            this.spinsNumber = value;
            this.updateSpinNumbers();
            this.slotMachine.emit("AUTO_PLAY_SLIDER_CHANGE", value);
        })

        this.turboSwitch.on(SwitchEvent.STATE_CHANGED, this.onTurboBtnStateChange, this);
        
        this.slotMachine = container.resolve(SlotMachine);
        this.slotMachine.on("AUTO_PLAY_SLIDER_CHANGE", this.onAutoPlaySliderChange, this);
        this.updateSpinNumbers();
        

        [this.inputSingleWin, this.inputIncreaseBy, this.inputDecreaseBy].forEach((input) => {
            const allowedChars: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
            input.onChange.connect((e) => {
                if (
                    !allowedChars.includes(e[e.length - 1]) || // if the latest char is allowed
                    (e.slice(0, e.length - 1).includes('.') && e[e.length - 1] === '.') || // if the latest char isn't duplicated dot
                    (e[e.length - 1] === '.' && e.length <= 1)
                ) {
                    //if the first char isn't a dot
                    input.value = e.slice(0, e.length - 1);
                    input['stopEditing']();
                    input['_startEditing']();
                }
            });

            input.onEnter.connect(() => {
                if(input.value !== '' || input.value.trim() !== '') 
                    input['placeholder'].visible = false;
            });
        })

        this.tabViews['area'].alpha = 0;
        this.heading1On.on('pointerup', this.onBtnHeading1, this);
        this.heading1Off.on('pointerup', this.onBtnHeading1, this);
        this.heading2On.on('pointerup', this.onBtnHeading2, this);
        this.heading2Off.on('pointerup', this.onBtnHeading2, this);
        this.btnConfirm.on('pointerup', this.onBtnConfirm, this);
        this.on('added', this.onAdded, this);
    }


    // PUBLIC API
    public onAdded(): void {
        this.tab1.visible = true;
        this.tab2.visible = false;
        this.onBtnHeading1();

        [this.inputSingleWin, this.inputIncreaseBy, this.inputDecreaseBy].forEach((input) => {
            input.value = '';
        });
        
        this.updateView();
    }

    public override updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);

        this.scale.set(2);
        this.position.set(0, desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2);
        this.pivot.set(244, 1190);
    }

    
    private onAutoPlaySliderChange(value: number) {
        this.spinsNumber = value;
        this.slider.value = value
        this.slider.children[1].x = (((this.slider.children[0] as Container).width - (this.slider.children[1] as Container).width + 1) / 1000) * value;
        this.updateSpinNumbers();
    }
    
    protected updateSpinNumbers() {
        this.btnConfirmTxt.text = `${AssetsManager.translations.get('autoSpin.tfConfirm')} (${this.spinsNumber})`
    }

    public customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                if(instance['area'])    instance['area'].alpha = 0;
                break;
                
            case 'Slider':
                instance = new Slider({
                    bg: 'autospin-slider-bg',
                    fill: 'autospin-slider-fill',
                    slider: 'autospin-slider-dot',
                    min: 0,
                    max: 1000,
                    value: 500
                });
                break;
                
            case 'SwitchView':
                instance = new SwitchView(le)
                break;

            case 'Input':
                instance = new Input({
                    bg: 'autospin-input-bcg',
                    placeholder: `  ${AssetsManager.translations.get("autoSpin.tfInputPlaceHolder")}               `, // That looks weird, but the input invokes when user click on placeholder so value has to be "spaces" to detect click.
                    padding: [1, 1, 1, 5],
                    textStyle: {
                        fill: '0xffffff',
                        fontFamily: AssetsManager.webFonts.get('InterMedium').family,
                        align: 'center',
                        fontSize: 14
                    }
                });
                break;
        }
        return instance;
    }

    
    private onBtnHeading1 (): void {
        this.heading1On.visible = true;
        this.heading1Off.visible = false;
        this.heading2On.visible = false;
        this.heading2Off.visible = true;
        
        this.tab1.visible = true;
        this.tab2.visible = false;
    }

    private onBtnHeading2 (): void {
        this.heading1On.visible = false;
        this.heading1Off.visible = true;
        this.heading2On.visible = true;
        this.heading2Off.visible = false;
        
        this.tab1.visible = false;
        this.tab2.visible = true;
    }
    
    private onTurboBtnStateChange() {
        switch (this.turboSwitch.state) {
            case SwitchState.ON:
                new ControlEvent(UIEvent.GAME_SPEED_LEVEL_UP).dispatch();
                break;
            case SwitchState.OFF:
                new ControlEvent(UIEvent.GAME_SPEED_LEVEL_DOWN).dispatch();
                break;
        }
    }
    
    private get settings(): AutoplaySettings {
        const data: AutoplaySettings = {
            spinsLeft: this.spinsNumber,
        };

        data.onAnyWin = this.anyWinSwitch.state === SwitchState.ON;
        data.onBonusGameWon = this.bonusWinSwitch.state === SwitchState.ON;
        data.onSingleWinExceed = parseFloat(this.inputSingleWin.value);
        data.onCashBalanceIncreaseBy = parseFloat(this.inputIncreaseBy.value);
        data.onCashBalanceDecreaseBy = parseFloat(this.inputDecreaseBy.value);

        return data;
    }
    
    public updateView(): void {
        this.turboSwitch.setInitialState(this.gs.settings.quickSpin ? SwitchState.ON : SwitchState.OFF);
        // this.skipScreenSwitch.setInitialState(this.gs.settings.introScreen ? SwitchState.ON : SwitchState.OFF);
    }
    
    // USER INTERACTION
    public onBtnConfirm(): void {
        super.onBtnClose();
        new ControlEvent(UIEvent.AUTO_SPIN, this.settings).dispatch();
    }
}