import { App_Model } from "./App_Model";

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
    const file_content = model.dmn_data?.file_content;
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
    const input_data = model.input_data;
    if (!input_data) {
      this._elements.input.innerHTML = "No input data";
      this._elements.input_card.classList.add("border-warning");
      return;
    }
    this._elements.input.innerHTML = JSON.stringify(input_data);
    this._elements.input_card.classList.remove("border-warning");
  }
  public renderOutput(model: App_Model) {
    const output_data = model.output_data;
    if (!output_data) {
      this._elements.output.innerHTML = "No output data";
      this._elements.output.classList.add("border-danger");
      return;
    }
    this._elements.output.innerHTML = JSON.stringify(output_data);
    this._elements.output.classList.remove("border-danger");
  }
}