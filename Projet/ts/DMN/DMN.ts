import { evaluate, unaryTest } from "feelin";
import { DMN_Decision, DMN_DecisionRule, DMN_Definitions, DMN_InformationRequirement, DMN_UnaryTests, DMN_data, ModdleElement, is_DMN_Decision } from "./DMN-JS";

export class DMN {
  private _dmn_data: DMN_data|null = null;

  public get dmn_data(): DMN_data|null {
    return this._dmn_data;
  }
  public set dmn_data(dmn_data: DMN_data|null) {
    this._dmn_data = dmn_data;
  }

  private _evaluateMe(me: DMN_Decision, input_data: {[id: string]: string[]}): string[] {
    // console.log(me);
    // console.log("in:", me.name, input_data);
    
    const {input, rule} = me.decisionLogic;
    const hit_policy: string = me.decisionLogic.hitPolicy || "UNIQUE";

    // Evaluation des règles
    const result: string[] = [];
    rule.forEach((decision_rule: DMN_DecisionRule) => {
      let rule_fulffiled: boolean = true;
      let j=0;
      while (j<decision_rule.inputEntry.length && rule_fulffiled) {
        const unary_tests: DMN_UnaryTests = decision_rule.inputEntry[j];
        const text: string = input[j].inputExpression!.text;
        if (unary_tests.text !== "" && text) {
          const context: {[text: string]: string[]} = {[text]: input_data[text]};

          // console.log(`${text} =? ${unary_tests.text}`, `{${text}: ${input_data[text]}}`);
          let evaluation: boolean|null = unaryTest(`${text} = ${unary_tests.text}`, context);
          if (evaluation === null) {
            try {
              evaluation = evaluate(`${text} ${unary_tests.text}`, context);
            } catch {}
          }
          
          // console.log("evaluation: ", evaluation); 
          if (!evaluation)
            rule_fulffiled = false;
        }
        j++;
      }
      if (rule_fulffiled) {
        result.push(decision_rule.outputEntry[0].text.replace('"', "").replace('"', ""));
        // console.log("out:", output[0].name, result);
      }
    });

    switch (hit_policy) {
      case "UNIQUE":
        console.log("UNIQUE result: ", result);
        
        return [result[0]];
      case "FIRST":
        return [result[0]];
      case "PRIORITY":
        return [result[0]];
      default:
        return result;
    }
  }

  public evaluate(input_data: {[id: string]: string[]}): {[id: string]: string[]}|null {
    if (!this._dmn_data)
      return null;

    const root: DMN_Definitions = <DMN_Definitions>this._dmn_data.me;
    // console.log(root);

    // Fonction récursive d'évaluation d'une décision
    const evaluateMe = (me: DMN_Decision): string[] => {
      // Recherche des données d'entrée
      me.informationRequirement?.forEach((me: DMN_InformationRequirement) => {
        if (!me.requiredDecision) 
          return;

        const refId: string|null = me.requiredDecision.href.slice(1);
        const refMe: ModdleElement|undefined = root.drgElement.find((me: ModdleElement) => is_DMN_Decision(me) && me.id === refId);
        
        if (!refMe || !is_DMN_Decision(refMe))
          return;
        const output_name: string = refMe.decisionLogic.output[0].name || "";
        
        if (input_data[output_name].length === 0)
          input_data[output_name] = evaluateMe(refMe);
      });
      return this._evaluateMe(me, input_data);
    }

    // Parcours en profondeur des décisions
    let output_data: {[id: string]: string[]} = {};
    root.drgElement.forEach((me: ModdleElement) => {
      if (is_DMN_Decision(me)) {
        output_data[me.name] = evaluateMe(me);
      }
    });
    return output_data;
  }
}