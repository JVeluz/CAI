import { App_Model } from "./App_Model";
import { ModdleElement, is_DMN_Decision, is_DMN_Definitions } from "./DMN/DMN-JS";

declare const DmnJS: any;

export class App_View {
  private _dmn_viewer: any = new DmnJS({container: `#dmn`});
  private _elements: { [key: string]: HTMLElement } = {
    dmn_card: document.getElementById("dmn-card")!,
    dmn: document.getElementById("dmn")!,

    input_card: document.getElementById("input-card")!,
    input: document.getElementById("input")!,
    
    output_card: document.getElementById("output-card")!,
    output: document.getElementById("output")!,
  };

  public async renderDMN(model: App_Model) {
    const file_content = model.dmn!.dmn_data!.file_content;
    if (!file_content) {
      this._elements.dmn.innerHTML = "No DMN data";
      this._elements.dmn_card.classList.add("border-danger");
      return;
    }
    try {
      await this._dmn_viewer.importXML(file_content);    
      this._elements.dmn_card.classList.remove("border-danger");
    } catch (error) {
      this._elements.dmn.innerHTML = "Error while rendering DMN";
      this._elements.dmn_card.classList.add("border-warning");
      console.error(error);
    }
  }
  public renderInput(model: App_Model) {
    this._elements.input.innerHTML = "";

    const root: ModdleElement = model.dmn!.dmn_data!.me;
    if (!is_DMN_Definitions(root))
      return;

    for (const me of root.drgElement) {
      if (!is_DMN_Decision(me))
        continue;
      
      for (const input_clause of me.decisionLogic.input) {
        const input_name: string = input_clause.inputExpression!.text || "";
        const input_type: string = input_clause.inputExpression!.typeRef || "";
        
        const tr: HTMLTableRowElement = document.createElement("tr");
        const td_name: HTMLTableCellElement = document.createElement("td");
        const td_type: HTMLTableCellElement = document.createElement("td");
        const td_value: HTMLTableCellElement = document.createElement("td");
        const td_input_group: HTMLElement = document.createElement("div");
        const td_input: HTMLInputElement = document.createElement("input");
        
        td_input_group.classList.add("input-group", "input-group-sm");
        td_input.classList.add("form-control");
        td_input.setAttribute("type", "text");
        td_input.setAttribute("id", input_name);
        td_input.setAttribute("value", model.input_data?.[input_name]?.join(", ") || "");

        td_name.innerHTML = input_name;
        td_type.innerHTML = input_type;
  
        td_input_group.appendChild(td_input);
        td_value.appendChild(td_input_group);
        tr.appendChild(td_name);
        tr.appendChild(td_type);
        tr.appendChild(td_value);
        this._elements.input.appendChild(tr);
      }
    }
  }
  public renderOutput(model: App_Model) {
    this._elements.output.innerHTML = "";

    const output_data = model.output_data;
    if (!output_data) {
      this._elements.output.innerHTML = "No output data";
      this._elements.output.classList.add("border-danger");
      return;
    }
    this._elements.output.classList.remove("border-danger");
    
    for (const [key, value] of Object.entries(output_data)) {
      const tr: HTMLTableRowElement = document.createElement("tr");
      const td_name: HTMLTableCellElement = document.createElement("td");
      const td_value: HTMLTableCellElement = document.createElement("td");
      
      td_name.innerHTML = key;
      td_value.innerHTML = value.join(", ");

      tr.appendChild(td_name);
      tr.appendChild(td_value);
      this._elements.output.appendChild(tr);
    }
  }
}