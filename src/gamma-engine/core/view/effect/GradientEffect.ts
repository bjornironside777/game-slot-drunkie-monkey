import IEffect from './IEffect';
import { DisplayObject, ITextStyle, Text, TextStyle, TextStyleLineJoin } from 'pixi.js';

/**
 * Example:
 * {
 *      "effects":[
 *          {
 *              "type":"gradient"
 *              "options":{
 *                  "fill": [
 *                      "0xFFFFFF",
 *                      "0x010101",
 *                  ]
 *              },
 *          }
 *      ]
 * }
 */
export default class GradientEffect implements IEffect {
    readonly options: GradientEffectOptions;

    constructor(options: Partial<GradientEffectOptions>) {
        this.options = {
            fill: options.fill
        };
    }

    public apply(displayObject: DisplayObject): void {
        if (displayObject instanceof Text) {
            const tf: Text = displayObject as Text;
            const ts: TextStyle | Partial<ITextStyle> = tf.style;
            ts.fill = this.options.fill;
            tf.style = ts;
        } else {
            throw new Error('Unsupported DisplayObject for effect StrokeEffect');
        }
    }
}

export interface GradientEffectOptions {
    fill: string[] | number[];
}
