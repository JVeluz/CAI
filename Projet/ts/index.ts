import { evaluate, unaryTest } from "feelin";
import { App_Controller } from "./App_Controller";
import { App_Model } from "./App_Model";
import { App_View } from "./App_View";

new App_Controller(new App_Model(), new App_View());

function test() {
  const evaluation: boolean|null = unaryTest("[13..65)", {'?': ['14']});
  console.log("test:", evaluation);
}

test();