import ControlCommand from '../../../gamma-engine/core/control/command/ControlCommand';
import ControlEvent from '../../../gamma-engine/core/control/event/ControlEvent';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import {container} from 'tsyringe';
import {UIEventExtension} from '../event/UIEventExtension';
import Wallet from '../../../gamma-engine/slots/model/Wallet';

export class AdjustTotalBetCommand extends ControlCommand {
    execute(event: ControlEvent): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const betLimits: number[] = sm.description.betLimits;
        switch (event.type) {
            case UIEventExtension.TOTAL_BET_UP:
                if (betLimits.indexOf(sm.currentBetValue) < betLimits.length - 1) {
                    sm.currentBetValue = betLimits[betLimits.indexOf(sm.currentBetValue) + 1];
                }
                break;
            case UIEventExtension.TOTAL_BET_DOWN:
                if (betLimits.indexOf(sm.currentBetValue) != 0) {
                    sm.currentBetValue = betLimits[betLimits.indexOf(sm.currentBetValue) - 1];
                }
                break;
        }
    }
}