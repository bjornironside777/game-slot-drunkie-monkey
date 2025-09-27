import { Container, Text } from 'pixi.js';
import { AutoplaySettings } from '../../../slots/model/Autoplay';
import { CheckBoxOption } from './CheckBoxOption';
import { ButtonOption } from './ButtonOption';
import Button from '../../../core/view/ui/Button';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { UIEvent } from '../../../slots/control/event/UIEvent';
import { AutospinOption } from '../../model/AutospinOption';
import Panel from './Panel';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';
import LayoutElement from '../../../core/view/model/LayoutElement';
// import Translation from '../../../core/translations/Translation';
import { Input, Slider } from '@pixi/ui';
import { container } from 'tsyringe';
import AssetsManager from '../../../core/assets/AssetsManager';
import ValueText from '../../../core/view/text/ValueText';
import SlotMachine from '../../../slots/model/SlotMachine';
import Wallet from '../../../slots/model/Wallet';
import AdjustSettings from './AdjustSettings';
import { SwitchEvent, SwitchState } from './SwitchState';
import SwitchView from './SwitchView';
import GameService from '../../../../drunkie-monkey/services/GameService';

export default class AutospinPanelDesktop extends Panel {
    
    private spinsNumber: number = 500;
    private tfTotalAutoSpinValue: Text
    private gs: GameService;
    private slider: Slider;
    private btnConfirm: Button;
    private turboSwitch: SwitchView;
    private skipScreenSwitch: SwitchView;
    private anyWinSwitch: SwitchView;
    private bonusWinSwitch: SwitchView;
    private btnConfirmTxt: Text;
    private inputSingleWin: Input;
    private inputIncreaseBy: Input;
    private inputDecreaseBy: Input;
    private slotMachine: SlotMachine;
    
    // VISUALS
    public tfTotalBetValue: ValueText;
    public content: Container;

    constructor(layout: string) {
        super(AssetsManager.layouts.get(layout));
        this.btnConfirm.on('pointerup', this.onBtnConfirm, this);
        this.slotMachine = container.resolve(SlotMachine);
        this.btnConfirmTxt = this.btnConfirm['normal']['tfConfirm'];
        this.gs = container.resolve('GameService');

        this.slider.onUpdate.connect((value) => {
            if(value < 5)
                value = 5;
            this.spinsNumber = value;
            this.updateSpinNumbers();
            this.slotMachine.emit("AUTO_PLAY_SLIDER_CHANGE", value);
        })

        this.turboSwitch.on(SwitchEvent.STATE_CHANGED, this.onTurboBtnStateChange, this);
        // this.skipScreenSwitch.on(SwitchEvent.STATE_CHANGED, this.changeIntroScreen, this);

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

        this.on('added', this.onAdded, this);
    }

    // PRIVATE API

    private onAdded(): void {
        [this.inputSingleWin, this.inputIncreaseBy, this.inputDecreaseBy].forEach((input) => {
            input.value = '';
        });

        this.updateView();
    }

    private onAutoPlaySliderChange(value) {
        this.spinsNumber = value;
        this.slider.value = value
        this.slider.children[1].x = (((this.slider.children[0] as Container).width - (this.slider.children[1] as Container).width + 1) / 1000) * value;
        this.updateSpinNumbers();
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

    private changeIntroScreen(): void {
        this.gs.settings.introScreen = !this.gs.settings.introScreen;
        this.gs.saveSettings();
    }

    // PUBLIC API

    public override updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        this.children.forEach((child) => child['updateLayout']?.(desc));
    }

    protected updateSpinNumbers() {
        this.tfTotalAutoSpinValue.text = `${this.spinsNumber}`;
        this.btnConfirmTxt.text = `${AssetsManager.translations.get('autoSpin.tfConfirm')} (${this.spinsNumber})`
    }

    public customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;
        switch (le.customClass) {
            case 'AdjustSettings':
                instance = new AdjustSettings(le);
                break
            case 'Button':
                instance = new Button(le);
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
