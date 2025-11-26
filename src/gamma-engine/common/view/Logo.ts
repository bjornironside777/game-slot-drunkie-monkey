import { ITrackEntry, Spine } from 'pixi-spine';
import AssetsManager from '../../core/assets/AssetsManager';
import { Tweener } from '../../core/tweener/engineTween';

export default class Logo extends Spine {
    constructor(isLoop: boolean = false, delayBetweenAnimations: number = 3) {
        super(AssetsManager.spine.get('logo'));
        this.visible = false;

        this.state.addListener({
            complete: (entry: ITrackEntry) => {
                Tweener.addCaller(this, {
                    count: 1,
                    time: delayBetweenAnimations,
                    onComplete: () => {
                        this.onAdded(isLoop);
                    }
                });
            }
        })
        this.on('added', this.onAdded, this);
    }

    private onAdded(isLoop): void {
        this.state.setEmptyAnimations(0);
        this.state.setAnimation(0, 'idle', isLoop);
    }
    public playWinAnimation(animationName: string): void {
        this.state.data.setMix('idle', animationName, 0.15);
        this.state.data.setMix(animationName, 'idle', 0.15);
        this.state.setAnimation(0, animationName, false);
    }
}
