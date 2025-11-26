import Panel from "./Panel";
import AssetsManager from "../../../core/assets/AssetsManager";
import {DisplayObject, Graphics, Text} from "pixi.js";
import {SwitchEvent, SwitchState} from "./SwitchState";
import LayoutElement from "../../../core/view/model/LayoutElement";
import AdjustSettings from "./AdjustSettings";
import LinkModule from "./LinkModule";
import AdjustTotalBet from "./AdjustTotalBet";
import { UpdateLayoutDescription } from "../../../core/view/UpdateLayoutDescription";
import { ScreenOrientation } from "../../../core/view/ScreenOrientation";

export default class SystemSettingsPanelHorizontal extends Panel {
    private adjustSettings: AdjustSettings;

    public title: Text;

    constructor() {
        super(AssetsManager.layouts.get('SystemSettingsPanelHorizontal'));
    }

    public customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown

        switch (le.customClass) {
            case 'AdjustSettings':
                instance = new AdjustSettings(le);
                break
            case 'LinkModule':
                instance = new LinkModule(le);
                break
            case 'AdjustTotalBet':
                instance = new AdjustTotalBet(le);
                break
            default:
                instance = super.customClassElementCreate(le)
        }
        return instance;
    }

    public override updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);

        this.on('added', () => {
            this.adjustSettings.updateView();
        }, this);
    }
}