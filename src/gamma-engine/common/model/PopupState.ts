import EventEmitter from 'eventemitter3';
import {UIStateEvent} from './event/UIStateEvent';
import IPopupCallbacks from '../../slots/view/popup/IPopupCallbacks';
import { PopupAnimationConfig } from '../../slots/view/popup/PopupAnimationConfig';
import PopupManager from '../../slots/view/popup/PopupManager';

export enum PopupType {
    NOT_ENOUGH_BALANCE = 'notEnoughBalance',
    CONNECTION_LOST = 'connectionLost',
    FEATURE_BUY = 'featureBuy',
    BIG_WIN = 'bigWin',
    FREE_SPIN_INTRO = 'freeSpinIntro',
    FREE_SPIN_OUTRO = 'freeSpinOutro',
    BONUS_GAME_INTRO = 'bonusGameIntro',
    BONUS_GAME_OUTRO = 'bonusGameOutro'
}

export class PopupData{
    public type: PopupType;
    public hideOnClick: boolean = false;
    public duration: number = -1;
    public callbacks: IPopupCallbacks = null;
    public animationConfig?:() =>  Partial<PopupAnimationConfig> = ()=> PopupManager.defaultAnimationConfiguration; 
    public showSound?: string;
    public clickOnPanelToClose?: boolean = false;
}

export default class PopupState extends EventEmitter {
    private _activePopup: PopupData | null = null;

    public get activePopup(): PopupData  {
        return this._activePopup;
    }

    public set activePopup(popup: PopupData | null) {
        this._activePopup = popup;
        this.emit(UIStateEvent.ACTIVE_POPUP_CHANGED, popup);
    }

    public get activeType(): PopupType{
        return this._activePopup.type;
    }
}
