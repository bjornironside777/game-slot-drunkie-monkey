import { Container } from "pixi.js";
import LayoutElement from "../../core/view/model/LayoutElement";
import LayoutBuilder from "../../core/utils/LayoutBuilder";
import { Tweener } from "../../core/tweener/engineTween";
import TotalWinFrame from "./TotalWinFrame";

export class MessageBox extends Container {
    public static HOLDSPACEBAR = 'HOLD_SPACE_BAR'
    public static BESTWISHES = 'BEST_WISHES'
    public static TOTALWIN = 'TOTAL_WIN'

    public totalWinFrameDesktop: TotalWinFrame;

    private holdSpaceBar: Container;
    private bestWishes: Container;

    constructor(le: LayoutElement) {
        super();

        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        })

        this.on('added', this.onAdded, this);
    }

    // PRIVATE API
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'TotalWinFrameDesktop':
                instance = new TotalWinFrame(le);
                break;
        }

        return instance;
    }

    private onAdded(): void {
        this.setMessage(MessageBox.HOLDSPACEBAR)
    }

    public setMessage(msg: string): void {
        let instance: Container;
        this.reset();
        switch(msg) {
            case MessageBox.HOLDSPACEBAR:
                instance = this.holdSpaceBar;
                break;
            case MessageBox.BESTWISHES:
                instance = this.bestWishes;
                break;
            case MessageBox.TOTALWIN:
                instance = this.totalWinFrameDesktop;
                break;
            default: 
                instance = this.holdSpaceBar;
        }
        instance.alpha = 1;
    }

    public reset(): void {
        this.children.forEach((children) => { children.alpha = 0 });
    }
}