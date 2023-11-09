import lol from "./Person.js";

class Student extends lol {
  private _num: string = "";
  constructor(firstname: string, lastname: string, num: string, options?: any) {
    super(firstname, lastname, options);
    
    this._num = num;
  }

  get num() {
    return this._num;
  }
}

class Promotion {
  private _students: Array<Student> = [];
  
  public add(student: Student) {
    this._students.push(student);
  }

  public print() {
    this._students.forEach((student: Student) => {
      student.print();
    });
  }
}

class Empty {}

function main() {
  let s1 = new Student("Jesse", "Veluz", "562040", {birth: "25/05/2002"});
  let s2 = new Student("Simon", "Arruzas", "154620", null);
  
  let promotion = new Promotion();
  promotion.add(s1);
  promotion.add(s2);
  promotion.print();

  let e = new Empty();
  console.log(s2, typeof s2);
  
}

window.addEventListener("load", function () {
  main();
});