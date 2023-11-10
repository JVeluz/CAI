import { unaryTest, evaluate } from "feelin";
import { DMN_DecisionRule, DMN_Definitions, DMN_UnaryTests, DMN_data, DMN_file, ModdleElement, Set_current_diagram, is_DMN_Decision} from "./DMN-JS"

declare const DmnJS: any;
declare const DmnModdle: any;

const dmnModdle = new DmnModdle();

async function readXML(file: File) {
  const xml: string = await file.text();
  const dmn_file: DMN_file = {file_name: file.name, file_content: xml};
  
  const {rootElement}: {rootElement: ModdleElement} = await dmnModdle.fromXML(xml);
  const dmn_data: DMN_data = {...dmn_file, me: rootElement};

  Set_current_diagram(dmn_file, dmn_data);
}

let viewer: any = new DmnJS({container: `#dmn`});;
async function viewXML(xml: string) {
  try {
    await viewer.importXML(xml);    
  } catch (error) {
    console.error(error);
  }
}
async function readJSON(file: File) {
  const json: string = await file.text();
  try {
    const input_data = JSON.parse(json);
    window.history.replaceState({
      ...window.history.state,
      input_data
    }, "");
  } catch (error) {
    console.error(error);
  }
}
function viewJSON(HTMLElementId: string, json: string) {
  let inputElement: HTMLElement|null = document.getElementById(HTMLElementId);
  if (inputElement)
    inputElement.innerHTML = json;
}
function evaluateMe(me: ModdleElement): null|{[id: string]: string} {
  // console.log(me);
  
  if (is_DMN_Decision(me)) {
    const {input, output, rule} = me.decisionLogic;

    for (let i=0; i<rule.length; i++) {
      const decision_rule: DMN_DecisionRule = rule[i];
      let rule_fulffiled: boolean = true;

      let j=0;
      while (j<decision_rule.inputEntry.length && rule_fulffiled) {
        const unary_tests: DMN_UnaryTests =  decision_rule.inputEntry[j];
        const text: string|undefined = input[j].inputExpression?.text;
        if (unary_tests.text !== "" && text) {
          const input_data = window.history.state.input_data;
          const context = {[text]: input_data[text]};
          
          //console.log(`${text} =? ${unary_tests.text}`, `{${text}: ${input_data[text]}}`);
          let evaluation: boolean|null = unaryTest(`${text} = ${unary_tests.text}`, context);
          if (evaluation === null)
            evaluation = evaluate(`${text} ${unary_tests.text}`, context);
          //console.log("evaluation: ", evaluation);
          if (!evaluation)
            rule_fulffiled = false;
        }
        j++;
      }
      if (rule_fulffiled)
        return {[me.id]: decision_rule.outputEntry[0].text};
    }
  }
  return null;
}

function evaluateDMN() { 
  const dmn_data   = window.history.state?.data;
  const input_data = window.history.state?.input_data;
  if (!(dmn_data && input_data))
    return null;
  
  const root: DMN_Definitions = window.history.state.data.me;
  console.log(root);
  
  const output_data = evaluateMe(root.drgElement[0]);  
  viewJSON("output", JSON.stringify(output_data));
  window.history.replaceState({
    ...window.history.state,
    output_data
  }, "");
  document.getElementById("download-overlay")!.hidden = false;
}

async function fileHandeler(files: FileList) {
  for (let i=0; i<files.length; i++) {
    const file: File|null = files.item(i);
    if (!file) break;

    const data = await file.text();
    const file_ext: string = file.name.split(".")[file.name.split(".").length-1];    
    switch (file_ext) {
      case "dmn":
        await readXML(file);
        viewXML(data);
        break;
      case "json":
        await readJSON(file);
        viewJSON("input", data);
        break;
      default:
        break;
    }
  }
}
      
document.getElementById("file-upload")!.addEventListener("change", async (ev: Event) => {
  const target: any = ev.target;  
  const files: FileList = target.files;  
  await fileHandeler(files);
  evaluateDMN();
});

window.addEventListener("drop", async (ev: DragEvent) => {
  ev.preventDefault();
  if (!ev.dataTransfer?.items)
    return;
  const files: FileList = ev.dataTransfer.files;  
  await fileHandeler(files);
  evaluateDMN();
});
window.addEventListener("dragover", (ev: DragEvent) => {
  ev.preventDefault();
});
window.addEventListener("load", () => {
  const dmn_data = window.history.state?.data;
  if (dmn_data)
    viewXML(dmn_data.file_content);
  const input_data = window.history.state?.input_data;
  if (input_data)
    viewJSON("input", JSON.stringify(input_data));
  const output_data = window.history.state?.output_data;
  if (output_data)
    viewJSON("output", JSON.stringify(output_data));
});