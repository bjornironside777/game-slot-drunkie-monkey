import { Container, NineSlicePlane, Text } from 'pixi.js';
import AssetsManager from '../../../core/assets/AssetsManager';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import { autoscaleText } from '../../../core/utils/Utils';
import LayoutElement from '../../../core/view/model/LayoutElement';
import Button from '../../../core/view/ui/Button';

export default class PopupConnectionLost extends Container {

    private errorCode: string;
    private tfMessage: Text;
    private frame: NineSlicePlane;
    private pageRefresh: Button;
    private defaultErrorCode: string = 'CONNECTION_LOST';

    constructor(errorCode: string | (() => string)) {
        super();
        LayoutBuilder.create(AssetsManager.layouts.get('PopupLostConnection'), this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.errorCode = (errorCode instanceof Function ? errorCode() : errorCode) ?? this.defaultErrorCode;
        this.pageRefresh.on('pointerup', this.onPageRefresh, this);
        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
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

    private onPageRefresh(): void {
        location.reload();
    }

    private onAdded(): void {
        this.tfMessage.text = AssetsManager.translations.get(`errorMessages.${this.errorCode}`) ?? AssetsManager.translations.get(`errorMessages.${this.defaultErrorCode}`);
        autoscaleText(this.tfMessage, 54, this.frame.width * 0.95, 70);
    }

    private onRemoved(): void {

    }
}
