import { unaryTest, evaluate } from "feelin";
import { DMN_DecisionRule, DMN_InformationRequirement, DMN_UnaryTests, DMN_data, DMN_file, ModdleElement, is_DMN_Decision} from "./DMN-JS"

declare const DmnJS: any;
declare const DmnModdle: any;

function toCamelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

class Model {
  private _dmn_data: DMN_data|null = null;
  private _input_data: {[id: string]: string[]}|null = null;
  private _output_data: {[id: string]: string[]}|null = null;

  constructor() {
    this._load();
  }

  public get dmn_data(): DMN_data|null {
    return this._dmn_data;
  }
  public set dmn_data(dmn_data: DMN_data|null) {
    this._dmn_data = dmn_data;
    this._save();
  }

  public get input_data(): {[id: string]: string[]}|null {
    return this._input_data;
  }
  public set input_data(input_data: {[id: string]: string[]}|null) {
    this._input_data = input_data;
    this._save();
  }
  
  public get output_data(): {[id: string]: string[]}|null {
    return this._output_data;
  }
  public set output_data(output_data: {[id: string]: string[]}|null) {
    this._output_data = output_data;
    this._save();
  }

  private _save() {
    window.history.pushState({
      dmn_data: this.dmn_data,
      input_data: this.input_data,
      output_data: this.output_data
    }, "");
  }
  private _load() {
    const state: any = window.history.state;
    console.log(state);
    
    if (state) {
      this.dmn_data = state.dmn_data;
      this.input_data = state.input_data;
      this.output_data = state.output_data;
    }
  }
}

class View {
  private _dmn_viewer: any = new DmnJS({container: `#dmn`});
  private _inputElement: HTMLElement = document.getElementById("input")!;
  private _outputElement: HTMLElement = document.getElementById("output")!;

  public async renderDMN(xml: string) {
    try {
      await this._dmn_viewer.importXML(xml);    
    } catch (error) {
      console.error(error);
    }
  }
  public renderInput(json: string) {
    this._inputElement.innerHTML = json;
  }
  public renderOutput(json: string) {
    this._outputElement.innerHTML = json;
  }
}

class Controller {
  private _model: Model;
  private _view: View;

  constructor(model: Model, view: View) {
    this._model = model;
    this._view = view;
    this._addListeners();
  }

  private _evaluateDMN(): {[id: string]: string[]} {
    const dmn_data = this._model.dmn_data!;
    const input_data = this._model.input_data!;
    
    const root: any = dmn_data.me;
    // console.log(root);
  
    // Marqueur pour les décisions déjà évaluées
    const checked: {[id: string]: boolean} = {};
    root.drgElement.forEach((me: ModdleElement) => {
      checked[me.id] = false;
    });
  
    // Evaluation d'une décision
    function evaluateMe(me: ModdleElement, input_data: {[id: string]: string[]}): {[id: string]: string[]} {
      // console.log(me);
      if (checked[me.id])
        return {};
      checked[me.id] = true;
    
      if (!is_DMN_Decision(me))
        return {};
      
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
    
      const {input, rule} = me.decisionLogic;
      const output: {[id: string]: string[]} = {};
      
      // Evaluation des règles
      rule.forEach((decision_rule: DMN_DecisionRule) => {
        let rule_fulffiled: boolean = true;
        let j=0;
        while (j<decision_rule.inputEntry.length && rule_fulffiled) {
          const unary_tests: DMN_UnaryTests =  decision_rule.inputEntry[j];
          const text: string|undefined = toCamelCase(input[j].label);
          if (unary_tests.text !== "" && text) {
            const context = {[text]: input_data[text]};
            
            // console.log(`${text} =? ${unary_tests.text}`, `{${text}: ${input_data[text]}}`);
            let evaluation: boolean|null = unaryTest(`${text} = ${unary_tests.text}`, context);
            if (evaluation === null)
              evaluation = evaluate(`${text} ${unary_tests.text}`, context);
            // console.log("evaluation: ", evaluation);
            
            if (!evaluation)
              rule_fulffiled = false;
          }
          j++;
        }
        if (rule_fulffiled) {
          if (!output[me.id])
            output[me.id] = [];
          output[me.id].push(decision_rule.outputEntry[0].text.replace('"', "").replace('"', ""));
          console.log("out:", me.id, output);
        }
      });
      return output;
    }
  
    // Parcours en profondeur des décisions
    let output_data: {[id: string]: string[]} = {};
    root.drgElement.forEach((me: ModdleElement) => {
      if (!checked[me.id])
        output_data = {...output_data, ...evaluateMe(me, input_data)};
    });

    return output_data;
  }

  private async _fileHandler(files: FileList) {
    for (let i=0; i<files.length; i++) {
      const file: File|null = files.item(i);
      if (!file) break;
  
      const data = await file.text();
      const file_ext: string = file.name.split(".")[file.name.split(".").length-1];    
      switch (file_ext) {
        case "dmn":
          await this._readDMN(file);
          this._view.renderDMN(data);
          break;
        case "json":
          await this._readInput(file);
          this._view.renderInput(data);
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
  private async _readInput(file: File) {
    const json: string = await file.text();
    try {
      const input_data = JSON.parse(json);
      this._model.input_data = input_data;
    } catch (error) {
      console.error(error);
    }
  }

  private _updateOutput() {
    if (!this._model.dmn_data || !this._model.input_data)
      return;
    const output_data = this._evaluateDMN();
    this._model.output_data = output_data;
    this._view.renderOutput(JSON.stringify(output_data));
  }

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
        this._view.renderDMN(this._model.dmn_data.file_content.toString());
      if (this._model.input_data)
        this._view.renderInput(JSON.stringify(this._model.input_data));
      this._updateOutput();
    });
  }
}

new Controller(new Model(), new View());