import { ProgressBar } from '@pixi/ui';
import { Container, Graphics, Sprite, Text, Ticker } from 'pixi.js';
import AssetsManager from '../../core/assets/AssetsManager';
import LayoutBuilder from '../../core/utils/LayoutBuilder';
import AdjustableLayoutContainer from '../../core/view/AdjustableLayoutContainer';
import LayoutElement from '../../core/view/model/LayoutElement';
import { ScreenOrientation } from '../../core/view/ScreenOrientation';
import { UpdateLayoutDescription } from '../../core/view/UpdateLayoutDescription';
import { Tweener } from '../../core/tweener/engineTween';

export class LoadingScreen extends AdjustableLayoutContainer {

    // VIEWS
    private progressBar: ProgressBar;
    private loadingText: Text;
    private loadingPercentage: Text;
    private backgroundColor: Graphics;
    private waterRippleContainer: Container;
    private background: Sprite;

    // Loading text animation state
    private _loadingTextAnimSpeed = 2;
    private _loadingTextAnimAccumulator = 0;
    private _loadingTextAnimFrame = 0;
    private _loadingTextTickerHandler: ((delta: number) => void) | null = null;
    private _loadingTextBase = '';

    // Ripple animation state
    private _rippleCount = 12;
    private _rippleGraphics: Graphics[] = [];
    private _rippleAnimSpeed = 6;
    private _rippleAnimAccumulator = 0;
    private _rippleAnimFrame = 0;
    private _rippleTickerHandler: ((delta: number) => void) | null = null;
    private _rippleSpacing = 60;
    private _rippleBaseRadius = 97.5;
    private _rippleAlpha = 0.02;
    private _rippleAnimate = true;

    constructor() {
        super(AssetsManager.layouts.get('loading-screen'));

        LayoutBuilder.create(this.layout, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.createRipples();

        this.on('added', this.onAdded, this);
        this.on('removed', this.onRemoved, this);
    }

    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'AssetsProgressBar':
                instance = new ProgressBar({
                    bg: 'loader-bcg',
                    fill: 'loader-fill',
                    progress: 0,
                    fillOffset: {
                        x: -38
                    }
                });
                break;
        }
        return instance;
    }


    private createRipples() {
        this._rippleGraphics.forEach(g => {
            if (g.parent) g.parent.removeChild(g);
            g.destroy();
        });
        this._rippleGraphics = [];

        for (let i = 0; i < this._rippleCount; i++) {
            const g = new Graphics();
            g.lineStyle(2, 0xffffff, this._rippleAlpha);
            const radius = this._rippleBaseRadius + i * this._rippleSpacing;
            g.drawCircle(0, 0, radius);
            g.alpha = 0;
            this.waterRippleContainer.addChild(g);
            this._rippleGraphics.push(g);
        }
    }

    private startRipples() {
        this._rippleAnimAccumulator = 0;
        this._rippleAnimFrame = 0;

        if (this._rippleTickerHandler) {
            Ticker.shared.remove(this._rippleTickerHandler);
            this._rippleTickerHandler = null;
        }

        if (!this._rippleAnimate) {
            for (let i = 0; i < this._rippleCount; i++) {
                this._rippleGraphics[i].alpha = 1;
            }
            return;
        }

        this._rippleTickerHandler = (delta: number) => {
            const elapsedSeconds = delta / 60;
            this._rippleAnimAccumulator += elapsedSeconds;
            const interval = 1 / Math.max(this._rippleAnimSpeed, 0.0001);
            if (this._rippleAnimAccumulator >= interval) {
                this._rippleAnimAccumulator -= interval;
                this._rippleAnimFrame = (this._rippleAnimFrame % this._rippleCount) + 1;
                for (let i = 0; i < this._rippleCount; i++) {
                    this._rippleGraphics[i].alpha = (i < this._rippleAnimFrame) ? 1 : 0;
                }
            }
        };

        Ticker.shared.add(this._rippleTickerHandler);
    }

    private stopRipples() {
        if (this._rippleTickerHandler) {
            Ticker.shared.remove(this._rippleTickerHandler);
            this._rippleTickerHandler = null;
        }
        for (const g of this._rippleGraphics) g.alpha = 1;
    }


    // PUBLIC API
    public onAdded() {
        // Fade in animation
        this.alpha = 0;
        Tweener.addTween(this, {
            alpha: 1,
            time: 0.5
        })

        this.loadingTextAnim();
        this.startRipples();
    }

    public onRemoved() {
        Tweener.removeTweens(this);
        if (this._loadingTextTickerHandler) {
            Ticker.shared.remove(this._loadingTextTickerHandler);
            this._loadingTextTickerHandler = null;
        }
        this.stopRipples();
    }

    private loadingTextAnim() {

        if (!this.loadingText) return;

        this._loadingTextBase = this.loadingText.text.replace(/\.+$/, '');
        this._loadingTextAnimAccumulator = 0;
        this._loadingTextAnimFrame = 0;

        if (this._loadingTextTickerHandler) {
            Ticker.shared.remove(this._loadingTextTickerHandler);
            this._loadingTextTickerHandler = null;
        }

        this._loadingTextTickerHandler = (delta: number) => {
            const elapsedSeconds = delta / 60;
            this._loadingTextAnimAccumulator += elapsedSeconds;

            const interval = 1 / Math.max(this._loadingTextAnimSpeed, 0.0001);
            if (this._loadingTextAnimAccumulator >= interval) {
                this._loadingTextAnimAccumulator -= interval;
                this._loadingTextAnimFrame = (this._loadingTextAnimFrame % 3) + 1;
                this.loadingText.text = this._loadingTextBase + '.'.repeat(this._loadingTextAnimFrame);
            }
        };

        Ticker.shared.add(this._loadingTextTickerHandler);
    }

    public setProgress(progress: number): void {
        Tweener.addTween(this.progressBar, {
            progress: progress,
            time: 0.5
        });

        this.loadingPercentage.text = `%${progress.toFixed(0)}`

        if (progress >= 100) {
            if (this._loadingTextTickerHandler) {
                Ticker.shared.remove(this._loadingTextTickerHandler);
                this._loadingTextTickerHandler = null;
            }
            if (this.loadingText) {
                this.loadingText.text = 'LOADED';
                this._loadingTextBase = 'LOADED';
            }
            this.stopRipples();
        }
    }

    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);

        desc.orientation === ScreenOrientation.HORIZONTAL ? this.loadingText.style.letterSpacing = 16.25 : this.loadingText.style.letterSpacing = 19.25;
        this.backgroundColor.width = desc.currentWidth;
        this.backgroundColor.height = desc.currentHeight;

        const xScale: number = desc.currentWidth / desc.baseWidth;
        const yScale: number = desc.currentHeight / desc.baseHeight;
        this.background.scale.set(xScale > yScale ? xScale : yScale);
    }
}
