import { Container, Text } from "pixi.js";
import LayoutBuilder from "../../gamma-engine/core/utils/LayoutBuilder";
import ValueText from "../../gamma-engine/core/view/text/ValueText";
import { Details } from "../../gamma-engine/slots/model/RoundResult";

export class BetDetails extends Container{
    protected tfBetID:ValueText;

    constructor(le) {
        super();
        LayoutBuilder.create(le, this, (le) => {
            return this.customClassElementCreate(le);
        });
       
    }
    customClassElementCreate(le) {
        let instance = null;
        switch (le.customClass) {
            case 'ValueText':
                instance = new ValueText(le);
                break;
        }
        return instance;
    }
    setBetDetails(betDetails:Details){
        this.tfBetID.tfValue.text = "Bet ID: "+ betDetails.betId.toString() + " | Game ID: "+ betDetails.gameId.toString()+ " | User ID: "+ betDetails.userId.toString()
       // this.tfGameID.tfValue.text ="Game ID: "+ betDetails.gameId.toString()
       // this.tfUserID.tfValue.text ="User ID: "+ betDetails.userId.toString()
    }
}