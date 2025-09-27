import {IAnimation} from '../IAnimation';
import {Container} from 'pixi.js';
import Button from '../Button';
import { Tweener } from '../../../tweener/engineTween';

export default class Bounce implements IAnimation{
    invoke(button:Button) {
        const minScale: number = 0.92;
        const maxScale: number = 1.03;

        const decreasingTime: number = 0.07;
        const increasingTime: number = 0.1;

        Tweener.addTween(button.scale, {
            x: minScale,
            y: minScale,
            time: decreasingTime,
            transition: 'easeOutSine'
        });

        Tweener.addTween(button.scale, {
            x: maxScale,
            y: maxScale,
            time: increasingTime,
            delay: decreasingTime,
            transition: 'easeOutSine'
        });

        Tweener.addTween(button.scale, {
            x: 1,
            y: 1,
            time: increasingTime,
            delay: decreasingTime + increasingTime,
            transition: 'easeOutSine'
        });
    }
}