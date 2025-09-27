import LayoutBuilder from '../../core/utils/LayoutBuilder';
import AssetsManager from '../../core/assets/AssetsManager';
import AdjustableLayoutContainer from '../../core/view/AdjustableLayoutContainer';
import { UpdateLayoutDescription } from '../../core/view/UpdateLayoutDescription';
import { ProgressBar } from '@pixi/ui';
import LayoutElement from '../../core/view/model/LayoutElement';
import { Tweener } from '../../core/tweener/engineTween';
import { Graphics, Sprite } from 'pixi.js';

export class LoadingScreen extends AdjustableLayoutContainer {

    // VIEWS
    private progressBar: ProgressBar;
    private background: Sprite;
    private poweredBy: Sprite;
    private poweredByMask: Graphics;
    private poweredByAnimStarted: boolean = false;

    constructor() {
        super(AssetsManager.layouts.get('loading-screen'));

        LayoutBuilder.create(this.layout, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'AssetsProgressBar':
                instance = new ProgressBar({
                    bg: 'loading-filler-bg',
                    fill: 'loading-filler',
                    progress: 0
                });
                break;
        }
        return instance;
    }

    // PUBLIC API
    public onAdded() {
        // Fade in animation
        this.alpha = 0;
        this.poweredBy.alpha = 0;
        this.poweredByAnimStarted = false;
        Tweener.addTween(this, {
            alpha: 1,
            time: 0.5
        })
        this.poweredByMask.scale.x = 1;
    }

    public onRemoved() {
        Tweener.removeTweens([
            this,
            this.poweredBy,
            this.poweredByMask
        ]);
    }

    public setProgress(progress: number): void {
        if (progress >= 50 && !this.poweredByAnimStarted) {
            this.poweredByAnimStarted = true;
            Tweener.addTween(this.poweredBy, {
                alpha: 1,
                time: 2
            })
            Tweener.addTween(this.poweredByMask.scale, {
                x: 0,
                time: 1.2
            })
        }
        Tweener.addTween(this.progressBar, {
            progress: progress,
            time: 1
        });
    }

    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        this.background.width = desc.currentWidth;
        this.background.height = desc.currentHeight;
    }
}