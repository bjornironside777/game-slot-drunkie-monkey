import { ITextStyle, Text, TextStyle, TextStyleLineJoin } from 'pixi.js';

export default class TextUtils {
    public static setTextStroke(tf: Text, color: string = '#FFFFFF', thickness: number = 2, lineJoin: TextStyleLineJoin): void {
        const ts: TextStyle | Partial<ITextStyle> = tf.style;
        ts.stroke = color;
        ts.strokeThickness = thickness;
        ts.lineJoin = lineJoin;
        tf.style = ts;
    }

    public static setTextDropShadow(tf: Text, color: string = '#000000', alpha: number = 1, angle: number = 0, blur: number = 0, distance: number = 1): void {
        const ts: TextStyle | Partial<ITextStyle> = tf.style;
        ts.dropShadow = true;
        ts.dropShadowAlpha = alpha;
        ts.dropShadowAngle = angle;
        ts.dropShadowBlur = blur;
        ts.dropShadowColor = color;
        ts.dropShadowDistance = distance;
        tf.style = ts;
    }

    public static setTextLetterSpacing(tf: Text, letterSpacing: number = 0): void {
        const ts: TextStyle | Partial<ITextStyle> = tf.style;
        ts.letterSpacing = letterSpacing;
        tf.style = ts;
    }
}
