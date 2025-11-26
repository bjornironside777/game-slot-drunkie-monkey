import Panel from "./Panel";
import AssetsManager from "../../../core/assets/AssetsManager";
import {UpdateLayoutDescription} from "../../../core/view/UpdateLayoutDescription";
import ScrolledSettings from "./ScrolledSettings";
import LayoutBuilder from "../../../core/utils/LayoutBuilder";
import LayoutElement from "../../../core/view/model/LayoutElement";
import {Container, Graphics} from "pixi.js";
import AdjustSettings from "./AdjustSettings";
import AdjustTotalBet from "./AdjustTotalBet";
import LinkModule from "./LinkModule";

export default class SystemSettingsPanelVertical extends Panel {
    private adjustSettings: AdjustSettings;

    public title: Text;

    constructor() {
        super(AssetsManager.layouts.get('SystemSettingsPanelVertical'));
        this.btnClose.scale.set(1.4);
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
        this.scale.set(2);
    }
}