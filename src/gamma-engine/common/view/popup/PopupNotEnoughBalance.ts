import { Container } from 'pixi.js';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import AssetsManager from '../../../core/assets/AssetsManager';
import LayoutElement from '../../../core/view/model/LayoutElement';
import Button from '../../../core/view/ui/Button';
import { UIPanelEvent } from '../../control/event/UIPanelEvent';
import SoundList from '../../sound/SoundList';
import SoundManager from '../../../core/sound/SoundManager';
import ControlEvent from '../../../core/control/event/ControlEvent';

export default class PopupNotEnoughBalance extends Container {
    private btnClose: Button;
    constructor() {
        super();
        LayoutBuilder.create(AssetsManager.layouts.get('PopupNotEnoughBalance'), this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });
        
        this.btnClose.on('pointerup', this.onBtnClose, this);
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
    }
}
