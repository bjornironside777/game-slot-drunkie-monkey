import { Spine } from "pixi-spine";
import AssetsManager from "../../gamma-engine/core/assets/AssetsManager";
import { TrackEntry } from "@pixi-spine/runtime-4.1";

export class GameTransitionAnimation extends Spine {
    constructor() {
        super(AssetsManager.spine.get('transition-animation'))

        this.on('added', this.onAdded, this)
    }

    private onAdded(): void {
        this.state.setEmptyAnimations(0);
        this.alpha = 0;
    }

    public setTransition(transitionName: string): Promise<void> {
        return new Promise((resolve) => {
            this.state.setAnimation(0, transitionName, false);
            this.alpha = 1;
            this.state.addListener({
                complete: (entry: TrackEntry) => {
                    if (entry.animation.name === transitionName) {
                        this.alpha = 0;
                        resolve();
                    }
                }
            });
        })
    }
}
