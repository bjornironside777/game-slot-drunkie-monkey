import { TrackEntry } from "@pixi-spine/runtime-4.1";
import { ISkeletonData, Spine } from "pixi-spine";

export default class Character extends Spine {

    private nextAnimation: { name: string; loop: boolean } | null = null;

    constructor(skeleton: ISkeletonData) {
        super(skeleton);

        this.state.addListener({
            complete: (entry) => {
                if (this.nextAnimation) {
                    this.state.setAnimation(0, this.nextAnimation.name, this.nextAnimation.loop);
                    this.nextAnimation = null;
                }
            },
        });

        this.on('added', this.onAdded, this);
    }

    private onAdded(): void {

    }

    public setAnimation(animationName: string, loop: boolean = true): void {
        const currentEntry = this.state.tracks[0] as TrackEntry;
        if (animationName === currentEntry?.animation?.name) return;

        this.state.setAnimation(0, animationName, loop);

        if (!loop && currentEntry?.animation?.name) {
            this.nextAnimation = {
                name: currentEntry?.animation?.name,
                loop: currentEntry.loop
            }
        }
    }

    public reset(visibility: boolean = true): void {
        this.state.setEmptyAnimations(0);
        this.state.clearListeners();
        this.visible = visibility;
    }
}

export const CharacterAnimations = {
    BASEGAME: {
        IDLE: 'idle',
        WIN: 'win_celebration',
        SCATTER: 'excitement'
    },
    FREEGAME: {
        IDLE: 'idle',
        WIN: 'win',
        SCATTER: 'excitement'
    }
}