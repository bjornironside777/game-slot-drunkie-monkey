import Button from '../../../core/view/ui/Button';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { UIPanelEvent } from '../../control/event/UIPanelEvent';
import SoundManager from '../../../core/sound/SoundManager';
import SlotMachine from '../../../slots/model/SlotMachine';
import { container } from 'tsyringe';
import { UIEvent } from '../../../slots/control/event/UIEvent';
import Panel from './Panel';
import SoundList from '../../sound/SoundList';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';
import BetSettings from './BetSettings';
import LayoutElement from '../../../core/view/model/LayoutElement';
import ValueText from '../../../core/view/text/ValueText';
import { Container, Text } from 'pixi.js';
import StatusComponent from './StatusComponent';
import { SlotMachineEvent } from '../../../slots/model/event/SlotMachineEvent';
import { SlotMachineState } from '../../../slots/model/SlotMachineState';

export default class AdjustBetPanelVertical extends Panel {
    // VISUALS
    private title:Container
    private tfTitle:Text;
    private tfMultiplier:Text
    private betSettings: BetSettings;
    public btnMaxBet: Button;



    constructor(layout: LayoutElement) {
        super(layout);//AssetsManager.layouts.get('AdjustBetPanel'));
        this.tfMultiplier = this.title['tfMultiplier']
        this.tfTitle= this.title['tfTitle']
        this.btnMaxBet.on('pointerup', this.onBtnMaxBet, this);
        this.tfTitle.x = 0
        const xSpacer:number = 15
        this.tfMultiplier.x = this.tfTitle.width + xSpacer

        this.title.pivot.x = this.title.width/2
        // this.title.x = this.background.width/2
        this.on('added', this.onAdded, this);
    }

    public onAdded(): void {
        this.tfMultiplier.text = `${container.resolve(SlotMachine).combinations}x`;
        this.betSettings.onAdded();
    }

    public customClassElementCreate(le){
        let instance: unknown = null ;

        switch (le.customClass) {
            case 'BetSettings':
                instance = new BetSettings(le);
                break;
            case 'ValueText':
                instance = new ValueText(le);
                break
            default:
                instance = super.customClassElementCreate(le)
        }

        return instance;
    }



    // PUBLIC API
    public updateLayout(desc: UpdateLayoutDescription) {
       super.updateLayout(desc);
       this.scale.set(2);
    }



    // PRIVATE API
    // USER INTERACTION
    private onBtnMaxBet(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIEvent.COIN_VALUE_MAX).dispatch();
        new ControlEvent(UIEvent.BET_QUANTITY_MAX).dispatch();
        // new ControlEvent(UIPanelEvent.CLOSE_PANEL).dispatch();
    }
}