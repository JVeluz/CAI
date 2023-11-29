declare const DmnJS: any;

export class View {
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