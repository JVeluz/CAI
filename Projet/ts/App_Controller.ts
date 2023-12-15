import { unaryTest, evaluate } from "feelin";
import { DMN_Decision, DMN_DecisionRule, DMN_InformationRequirement, DMN_UnaryTests, DMN_data, DMN_file, ModdleElement, is_DMN_Decision, is_DMN_Definitions } from "./DMN-JS";
import { App_Model } from "./App_Model";
import { App_View } from "./App_View";

declare const DmnModdle: any;

export class App_Controller {
  private _model: App_Model;
  private _view: App_View;

  private _addListeners() {
    document.getElementById("file-upload")!.addEventListener("change", async (ev: Event) => {
      const target: any = ev.target;  
      const files: FileList = target.files;  
      await this._fileHandler(files);
      this._updateOutput();
    });

    window.addEventListener("dragover", (ev: DragEvent) => {
      ev.preventDefault();
    });
    window.addEventListener("drop", async (ev: DragEvent) => {
      ev.preventDefault();
      if (!ev.dataTransfer?.items)
        return;
      const files: FileList = ev.dataTransfer.files;  
      await this._fileHandler(files);
      this._updateOutput();
    });
    window.addEventListener("load", () => {
      if (this._model.dmn_data?.file_content)
        this._view.renderDMN(this._model);
      if (this._model.input_data)
        this._view.renderInput(this._model);
      this._updateOutput();
    });
  }

  constructor(model: App_Model, view: App_View) {
    this._model = model;
    this._view = view;

    this._addListeners();
  }

  private _evaluateMe(me: DMN_Decision, input_data: {[id: string]: string[]}): {[id: string]: string[]} {
    // console.log(me);
  
    const {input, output, rule} = me.decisionLogic;
    const output_name: string = output[0].name || "";

    // Evaluation des règles
    const result: {[id: string]: string[]} = {[output_name]: []};
    rule.forEach((decision_rule: DMN_DecisionRule) => {
      let rule_fulffiled: boolean = true;
      let j=0;
      while (j<decision_rule.inputEntry.length && rule_fulffiled) {
        const unary_tests: DMN_UnaryTests =  decision_rule.inputEntry[j];
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
        result[output_name].push(decision_rule.outputEntry[0].text.replace('"', "").replace('"', ""));
        // console.log("out:", output[0].name, result);
      }
    });
    return result;
  }

  private _evaluateDMN(): {[id: string]: string[]} {
    const dmn_data = this._model.dmn_data!;
    const input_data = this._model.input_data!;
    
    const root: ModdleElement = dmn_data.me;
    // console.log(root);
    if (!is_DMN_Definitions(root))
      return {};

    // Marqueur pour les décisions déjà évaluées
    const checked: {[id: string]: boolean} = {};
    root.drgElement.forEach((me: ModdleElement) => {
      checked[me.id] = false;
    });

    // Fonction récursive d'évaluation d'une décision
    const evaluateMe = (me: DMN_Decision, input_data: {[id: string]: string[]}): {[id: string]: string[]} => {
      if (checked[me.id])
        return {};
      checked[me.id] = true;
      
      // Recherche des données d'entrée
      me.informationRequirement?.forEach((me: DMN_InformationRequirement) => {
        if (!me.requiredDecision)
          return;

        const refId: string|null = me.requiredDecision.href.slice(1);
        if (!input_data[refId]) {
          const refMe: ModdleElement|undefined = root.drgElement.find((me: ModdleElement) => me.id === refId);
          if (refMe) {
            if (is_DMN_Decision(refMe))
              input_data = {...input_data, ...evaluateMe(refMe, input_data)};
          }
        }
      });
      return this._evaluateMe(me, input_data);
    }

    // Parcours en profondeur des décisions
    let output_data: {[id: string]: string[]} = {};
    root.drgElement.forEach((me: ModdleElement) => {
      if (!checked[me.id] && is_DMN_Decision(me))
        output_data = {...output_data, ...evaluateMe(me, input_data)};
    });
    return output_data;
  }

  private async _fileHandler(files: FileList) {
    for (let i=0; i<files.length; i++) {
      const file: File|null = files.item(i);
      if (!file) break;
  
      const file_ext: string = file.name.split(".")[file.name.split(".").length-1];    
      switch (file_ext) {
        case "dmn":
          await this._readDMN(file);
          this._view.renderDMN(this._model);
          this._view.renderInput(this._model);
          break;
        case "json":
          this._view.renderInput(this._model);
          break;
        default:
          console.error(`File extension ${file_ext} not supported`);
          break;
      }
    }
  }

  private async _readDMN(file: File) {
    const dmnModdle = new DmnModdle();

    const xml: string = await file.text();
    const dmn_file: DMN_file = {file_name: file.name, file_content: xml};
    
    const {rootElement}: {rootElement: ModdleElement} = await dmnModdle.fromXML(xml);
    const dmn_data: DMN_data = {...dmn_file, me: rootElement};
    
    this._model.dmn_data = dmn_data;
  }

  private _updateOutput() {
    if (!this._model.dmn_data || !this._model.input_data)
      return;
    const output_data = this._evaluateDMN();
    this._model.output_data = output_data;
    this._view.renderOutput(this._model);
  }
}