import { Container, DEG_TO_RAD, Graphics, LINE_CAP, Ticker } from 'pixi.js';

export type MaskedProgressBarOptions = {
    backgroundColor?: string;
    fillColor: string;
    lineWidth: number;
    radius: number;
    value?: number;
    backgroundAlpha?: number;
    animate?: boolean;
    fillAlpha?: number;
    cap?: 'butt' | 'round' | 'square';
};

export class CircularProgressBar extends Container {
    private _progress = 0;
    private options: MaskedProgressBarOptions;

    private bgCircle = new Graphics();
    private fillCircle = new Graphics();

    innerView = new Container();

    constructor(options?: MaskedProgressBarOptions) {
        super();

        this.options = options;

        this.addChild(this.innerView);

        this.innerView.addChild(this.bgCircle, this.fillCircle);

        this.addBackground();

        if (options.value) {
            this.progress = options.value;
        }
        this.update()
    }

    private addBackground() {
        const {
            backgroundColor,
            lineWidth,
            radius,
            backgroundAlpha,
        } = this.options;

        let alpha = 1;

        if (backgroundAlpha > 0) {
            alpha = backgroundAlpha;
        }

        if (backgroundColor === undefined) {
            alpha = 0.000001;
        }

        this.bgCircle.lineStyle({
            width: lineWidth,
            color: backgroundColor,
            alpha
        }).drawCircle(0, 0, radius);
    }

    set progress(value: number) {
        if (value > 100) {
            value = 100;
        }

        if (value < 0) {
            value = 0;
        }

        this._progress = value;

        const {
            lineWidth,
            radius,
            fillColor,
            fillAlpha,
            cap
        } = this.options;

        if (value === 0 && fillAlpha === 0) {
            this.fillCircle.clear();

            return;
        }

        const startAngle = 0;
        const endAngle = 360 / 100 * value;

        this.fillCircle
            .clear()
            .lineStyle({
                width: lineWidth,
                color: fillColor,
                cap: cap as LINE_CAP,
                alpha: fillAlpha
            })
            .arc(0, 0, radius, (0 - 90 + startAngle) * DEG_TO_RAD, (0 - 90 + startAngle + endAngle) * DEG_TO_RAD);
    }

    get progress(): number {
        return this._progress;
    }

    private update() {
        let isFilling = true;
        let value = this.options.value;
        let animate = this.options.animate

        Ticker.shared.add(() => {
            if (!animate) {
                return;
            }

            isFilling ? value++ : value--;

            if (value >= 100) {
                isFilling = false;
            }
            else if (value <= 0) {
                isFilling = true;
            }

            this.progress = value;
            this.rotation += 0.1;
        })
    }
}