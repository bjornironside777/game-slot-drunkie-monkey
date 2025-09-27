import ControlCommand from '../../../core/control/command/ControlCommand';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { SlotGameEvent } from '../event/SlotGameEvent';
import SlotMachine from '../../model/SlotMachine';
import { container } from 'tsyringe';
import { SpinResult } from '../../model/RoundResult';

export default class ConfirmBonusWinRejectedCommand extends ControlCommand {

    public execute(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);

        const lastRound: SpinResult = sm.previousRoundResult.spins[sm.previousRoundResult.spins.length - 1];
        sm.roundResult.totalWinValue = 0;   // a workaround: win amount should not get added after selecting play later on login
        sm.currentSpinResult.bonus = null;
        sm.roundResult.complete = false;
        if(lastRound.bonus)    lastRound.bonus = null;

        new ControlEvent(SlotGameEvent.SPIN_RESULT_READY).dispatch();
    }
}
