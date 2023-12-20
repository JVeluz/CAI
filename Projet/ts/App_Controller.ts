import { DMN_data, DMN_file, ModdleElement } from "./dmn/DMN-JS";
import { App_Model } from "./App_Model";
import { App_View } from "./App_View";
import { DMN } from "./dmn/DMN";

declare const DmnModdle: any;

export class App_Controller {
  private _model: App_Model;
  private _view: App_View;

  private _addListeners() {
    document.getElementById("input")!.addEventListener("input", () => {
      this._readInput();
      this._updateOutput();
    });

    document.getElementById("file-upload")!.addEventListener("change", async (ev: Event) => {
      const target: any = ev.target;  
      const files: FileList = target.files;  
      await this._fileHandler(files);
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
    });
    window.addEventListener("load", () => {
      if (this._model.dmn) {
        this._view.renderDMN(this._model);
        this._view.renderInput(this._model);
        if (this._model.input_data)
          this._updateOutput();
      }
    });
  }

  constructor(model: App_Model, view: App_View) {
    this._model = model;
    this._view = view;

    this._addListeners();
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
          await this._readJSON(file);
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
    
    const dmn: DMN = new DMN();
    dmn.dmn_data = dmn_data;
    this._model.dmn = dmn;
  }

  private async _readJSON(file: File) {
    const json: string = await file.text();

    this._model.input_data = JSON.parse(json);    
  }

  private _readInput() {
    const input_data: {[id: string]: any[]} = {};
    const input: HTMLInputElement|HTMLSelectElement[] = Array.from(document.querySelectorAll("#input input, #input select"));    
    input.forEach((input: HTMLInputElement|HTMLSelectElement) => {
      const id: string = input.id;
      const value: string = input.value;
      input_data[id] = value===""? []:[value];
    });
    this._model.input_data = input_data;
  }

  private _updateOutput() {
    const input_data = this._model.input_data;
    const dmn: DMN|null = this._model.dmn;
    if (!dmn || !input_data)
      return;
    const output_data = dmn.evaluate(input_data);
    this._model.output_data = output_data;
    this._view.renderOutput(this._model);
  }
}