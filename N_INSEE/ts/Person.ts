export default class Person {
  public firstname: string;
  public lastname: string;
  // Optional
  private _birth: Date|null = null;

  constructor(firstname: string, lastname: string, options?: any) {
    this.firstname = firstname;
    this.lastname = lastname;

    if (options) {
      let birth = options.birth.split("/").map((value:string) => parseInt(value));
      this._birth = new Date(birth[2], --birth[1], birth[0]);        
    }
  }

  public print() {
    console.log(
      this.firstname +" "+ this.lastname +": "
      + this._birth, typeof this._birth 
    );
  }
}