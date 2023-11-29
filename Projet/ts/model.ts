import { DMN_data } from "./DMN-JS"

export class Model {
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
    if (state) {
      this.dmn_data = state.dmn_data;
      this.input_data = state.input_data;
      this.output_data = state.output_data;
    }
  }
}