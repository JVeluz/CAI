import { DMN } from "./dmn/DMN"

export class App_Model {
  private _dmn: DMN|null = null;
  private _input_data: {[id: string]: string[]}|null = null;
  private _output_data: {[id: string]: string[]}|null = null;

  constructor() {
    this._load();
  }

  public get dmn(): DMN|null {
    return this._dmn;
  }
  public set dmn(dmn: DMN|null) {
    this._dmn = dmn;
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
      dmn_data: this.dmn!.dmn_data,
      input_data: this.input_data,
      output_data: this.output_data
    }, "");
  }
  private _load() {
    const state: any = window.history.state;
    if (state) {
      const dmn: DMN = new DMN();
      dmn.dmn_data = state.dmn_data;
      this.dmn = dmn;
      this.input_data = state.input_data;
      this.output_data = state.output_data;
    }
  }
}