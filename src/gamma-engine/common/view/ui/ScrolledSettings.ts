import ScrolledContent from "./ScrolledContent";
import LayoutElement from "../../../core/view/model/LayoutElement";
import Button from "../../../core/view/ui/Button";
import IntroScreenBackground from "../../../../drunkie-monkey/view/IntroScreenBackground";
import LayoutBuilder from "../../../core/utils/LayoutBuilder";
import {DisplayObject, Text} from "pixi.js";
import SwitchModule from "./SwitchModule";
import LayoutElementFactory from "../../../core/view/model/LayoutElementFactory";
import SwitchView from "./SwitchView";
import AssetsManager from "../../../core/assets/AssetsManager";
import AdjustSettings from "./AdjustSettings";
import SettingsContent from "./SettingsContent";
import SystemSettingsPanelVertical from "./SystemSettingsPanelVertical";

export default class ScrolledSettings extends ScrolledContent{
    private SystemSettingsPanelMobile
    constructor(le:LayoutElement,SystemSettingsPanel:SystemSettingsPanelVertical) {
        super(le, ScrolledSettings.customClassElementCreate);
        this.SystemSettingsPanelMobile = SystemSettingsPanel
        this.assignContent()
    }
    private assignContent(){
        this.SystemSettingsPanelMobile.content = this.content
        this.SystemSettingsPanelMobile.updateItemsVertically(this.content.children , 100);
    }
    private static customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown =null;

        switch (le.customClass) {
            case 'SettingsContent':
                instance = new SettingsContent(le);
                break
        }

        return instance;
    }

    private updateVertical(){

    }
}