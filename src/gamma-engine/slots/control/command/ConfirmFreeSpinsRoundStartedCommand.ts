import { container } from 'tsyringe';
import SlotMachine from '../../model/SlotMachine';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { SlotGameEvent } from '../event/SlotGameEvent';
import ControlCommand from '../../../core/control/command/ControlCommand';

export default class ConfirmFreeSpinsRoundStartedCommand extends ControlCommand {

    public execute(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        sm.currentSpinResult.freespins.roundStarted = true;
        const currentBonus = sm.currentSpinResult.bonus
        if(currentBonus && currentBonus.remainingCount === currentBonus.totalCount) {
            // having freespins but current bonus is not activated
            sm.bonusForLater = currentBonus;    // saving bonus so that it can be executed after freespins end
            sm.currentSpinResult.bonus = null;
        }
        
        new ControlEvent(SlotGameEvent.SPIN_RESULT_READY).dispatch();
    }
}