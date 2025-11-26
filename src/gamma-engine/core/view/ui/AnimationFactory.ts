
import Logger from '../../utils/Logger';
import {IAnimation} from './IAnimation';
import Bounce from './ButtonAnimations/Bounce';

export default class AnimationFactory {
    public static create(animationData: IAnimationDescription): IAnimation {
        try {
            switch (animationData.type) {
                case 'bounce':
                    return new Bounce();
                default:
                    throw new Error(`Unknown animation type: ${animationData.type}`);
            }
        } catch (e: unknown) {
            Logger.warning(e.toString());
            return null;
        }
    }
}

export interface IAnimationDescription {
    type: string;
}