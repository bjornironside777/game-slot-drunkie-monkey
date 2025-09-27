import {Container, Sprite, Text, TextStyleAlign} from 'pixi.js';
import Button from '../../../core/view/ui/Button';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import LayoutElement from '../../../core/view/model/LayoutElement';
import {UIPanelEvent} from '../../control/event/UIPanelEvent';
import MetricsView from './MetricsView';
import {PopupAnimationConfig} from '../../../slots/view/popup/PopupAnimationConfig';
import SoundManager from '../../../core/sound/SoundManager';
import ControlEvent from '../../../core/control/event/ControlEvent';
import ScrolledContent from './ScrolledContent';
import IAdjustableLayout from '../../../core/view/IAdjustableLayout';
import SoundList from '../../sound/SoundList';
import {ScreenOrientation} from '../../../core/view/ScreenOrientation';
import {UpdateLayoutDescription} from '../../../core/view/UpdateLayoutDescription';
import SwitchView from "./SwitchView";
import {upgradeConfig} from "@pixi/particle-emitter";
import {noConflict} from "jquery";
import LayoutElementQuad from "../../../core/view/model/LayoutElementQuad";
import { CircularProgressBar } from './CircularProgressBar';

export default abstract class Panel extends Container implements IAdjustableLayout {

    public static defaultAdjustBetPanelAnimationConfiguration: PopupAnimationConfig = {
        showPopup: {
            pivotY: {
                value: 380,
                time: 0.55,
                transition: 'easeInOutQuart',
            },
            alpha: {
                value: 1,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hidePopup: {
            pivotY: {
                value: 0,
                time: 0.3,
                transition: 'easeInQuad',
            },
        },
        showOverlay: {
            alpha: {
                value: 0.7,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hideOverlay: {
            alpha: {
                value: 0,
                time: 0.15,
                transition: 'easeInQuad',
            },
        }
    }

    public static defaultPaytablePanelAnimationConfiguration: PopupAnimationConfig = {
        showPopup: {
            pivotY: {
                value: 0,
                time: 0.55,
                transition: 'easeInOutQuart',
            },
            alpha: {
                value: 1,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hidePopup: {
            pivotY: {
                value: 0,
                time: 0.3,
                transition: 'easeInQuad',
            },
        },
        showOverlay: {
            alpha: {
                value: 0.7,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hideOverlay: {
            alpha: {
                value: 0,
                time: 0.15,
                transition: 'easeInQuad',
            },
        }
    }

    // VISUALS

    protected btnClose:Button;
    public background: Sprite;


    public layoutDesc: UpdateLayoutDescription;

    protected defaultYpivot: number;

    public layout: LayoutElement;

    protected constructor(layout: LayoutElement) {
        super();

        LayoutBuilder.create(layout, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.layout = layout;
        this.btnClose.on('pointerup', this.onBtnClose, this);

        this.defaultYpivot = this.pivot.y;
        //this.pivot.y = 0;
    }

    // PUBLIC API
    updateLayout(desc: UpdateLayoutDescription): void {
         this.layoutDesc = desc;
        if(desc.orientation == ScreenOrientation.VERTICAL)
            this.y = desc.baseHeight / 2 + (desc.currentHeight - desc.baseHeight) / 2;
        else
            this.y = 0;


        // if(desc.orientation == ScreenOrientation.VERTICAL)
        //     this.y = desc.baseHeight/2 + (desc.currentHeight - desc.baseHeight) / 2//desc.baseHeight / 2 + (desc.currentHeight - desc.baseHeight) / 2 ;
        //
        // const widthToSet: number = desc.currentWidth;
        // let xToSet: number;
        // if(desc.orientation ==ScreenOrientation.VERTICAL) {
        //     xToSet = -(desc.currentWidth - desc.baseWidth) / 2;
        // } else {
        //     xToSet = -(desc.currentWidth - desc.baseHeight) / 2;
        // }
        //
        //
        // this.updateLayoutElements(widthToSet, xToSet);
    }
    public textAlign(tf: Text, style: TextStyleAlign = 'center'):void{
        tf.style.align = style;
    }

    public getDefaultYPivot(): number{
        return this.defaultYpivot;
    }

    public get animationConfiguration(): PopupAnimationConfig {
        return  Panel.defaultAdjustBetPanelAnimationConfiguration;
    }

    public get animationPaytableConfiguration(): PopupAnimationConfig {
        return  Panel.defaultPaytablePanelAnimationConfiguration;
    }

    // PRIVATE API
    protected updateLayoutElements(width: number, x: number): void {
        this.background.width = width;
        this.background.x = x;

    }

    protected updateItemsGrid(items: Container[], maxWidth: number, spacingX: number, spacingY: number, maxItems: number = 0 , reducedSpacingX:number =0, maxInRow?:number): void {
        let itemX: number = 0;
        let itemY: number = 0;

        let itemsInRow: Container[] = [];
        items.forEach((item: Container, index: number) => {
            item.position.set(itemX, itemY);
            itemX += (item.width + spacingX);

            itemsInRow.push(item);

            if ((item.position.x + item.width * 2) > maxWidth || index == items.length - 1 || (maxItems > 0 && !((index+1) % maxItems))) {
                const rowWidth: number = itemsInRow.reduce((rowWidth: number, item: Container): number => {
                    return rowWidth + item.width + spacingX;
                }, 0) - spacingX;
                itemsInRow.forEach(item => {
                    item.x += (maxWidth - rowWidth) / 2;
                })
                itemsInRow = [];
                itemX = 0;
                itemY += (item.height + spacingY);
            }
            if(maxInRow) {
                if (itemsInRow.length == maxInRow - 1) {
                    spacingX -= reducedSpacingX
                }
            }
        });
    }

    protected updateItemsVertically(items: Container[], spacingY: number): void {
        let y: number = 0;
        items.forEach((item) => {
            item.y = y;
            y += (item.height +spacingY);
        });
    }

    // USER INTERACTION
    protected onBtnClose(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        new ControlEvent(UIPanelEvent.CLOSE_PANEL).dispatch();
    }

    public customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                break;
            case 'MetricsView':
                instance = new MetricsView(le);
                break;
            case 'SwitchView':
                instance= new SwitchView(le);
                break;

            case 'CircularProgressBar':
                instance = new CircularProgressBar({
                    backgroundColor: '#999999',
                    fillColor: '#00b1dd',
                    radius: 35,
                    lineWidth: 10,
                    value: 50,
                    backgroundAlpha: 0.5,
                    fillAlpha: 0.8,
                    animate: true,
                    cap: 'round'
                })
                break;
        }
        return instance;
    }
}
