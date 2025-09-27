import ControlCommand from '../../../core/control/command/ControlCommand';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { SlotGameEvent } from '../event/SlotGameEvent';
import SlotMachine from '../../model/SlotMachine';
import { container } from 'tsyringe';

export default class ConfirmFreeSpinsRoundCompleteCommand extends ControlCommand {
    public execute(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        sm.currentSpinResult.freespins.roundComplete = true;
        if(sm.bonusForLater) {
            sm.currentSpinResult.bonus = sm.bonusForLater;
        }

        new ControlEvent(SlotGameEvent.SPIN_RESULT_READY).dispatch();
    }
}
