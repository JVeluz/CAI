import { unaryTest, evaluate } from "feelin";
import { DMN_Decision, DMN_DecisionRule, DMN_DecisionTable, DMN_Definitions, DMN_InformationRequirement, DMN_UnaryTests, DMN_data, DMN_file, ModdleElement, Set_current_diagram, is_DMN_Decision, is_DMN_InputData} from "./DMN-JS"

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


function evaluateMe(me: DMN_Decision, input_data: {[id: string]: string} = {}): null|{[id: string]: string} {
  console.log(me.name, input_data);
  const root: DMN_Definitions = window.history.state.data.me;

  const {input, output, rule} = me.decisionLogic;

  me.informationRequirement?.forEach((me: DMN_InformationRequirement) => {
    let refId: string|null = null;
    if (me.requiredDecision)
      refId = me.requiredDecision.href.slice(1);
    if (me.requiredInput)
      refId = me.requiredInput.href.slice(1);
      
    if (!input_data[refId!]) {
      const refMe: ModdleElement|undefined = root.drgElement.find((me: ModdleElement) => me.id === refId);
      if (refMe) {
        if (is_DMN_Decision(refMe))
          input_data = {...input_data, ...evaluateMe(refMe, input_data)};
      }
    }
  });
  
  for (let i=0; i<rule.length; i++) {
    const decision_rule: DMN_DecisionRule = rule[i];
    let rule_fulffiled: boolean = true;

    let j=0;
    while (j<decision_rule.inputEntry.length && rule_fulffiled) {
      const unary_tests: DMN_UnaryTests =  decision_rule.inputEntry[j];
      const text: string|undefined = input[j].label.toLocaleLowerCase();
      if (unary_tests.text !== "" && text) {
        const context = {[text]: input_data[text]};
        
        console.log(`${text} =? ${unary_tests.text}`, `{${text}: ${input_data[text]}}`);
        let evaluation: boolean|null = unaryTest(`${text} = ${unary_tests.text}`, context);
        if (evaluation === null)
          evaluation = evaluate(`${text} ${unary_tests.text}`, context);
        console.log("evaluation: ", evaluation);
        if (!evaluation)
          rule_fulffiled = false;
      }
      j++;
    }
    if (rule_fulffiled) {
      console.log("Out: ", me.name, input_data, decision_rule.outputEntry[0].text.replace('"', "").replace('"', ""));
      
      return {[me.name.toLocaleLowerCase()]: decision_rule.outputEntry[0].text.replace('"', "").replace('"', "")};
    }
  }
  return null;
}

function evaluateDMN() { 
  const dmn_data   = window.history.state?.data;
  const input_data = window.history.state?.input_data;
  if (!(dmn_data && input_data))
    return null;
  
  const root: DMN_Definitions = dmn_data.me;
  console.log(root);
  
  let output_data: {[id: string]: string} = {};
  root.drgElement.forEach((me: ModdleElement) => {
    if (is_DMN_Decision(me)) {
      console.log("--------------------");
      
      output_data = {...output_data, ...evaluateMe(me, input_data)};
    }
  });

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