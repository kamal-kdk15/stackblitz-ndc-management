import fs from "fs";
import path from "path";

const file = path.join(process.cwd(),"app", "data","audit.json");

export function logAudit(
action,
performedBy,
recordId="",
oldValue="",
newValue=""
){

let logs=[];

if(fs.existsSync(file)){
logs=JSON.parse(fs.readFileSync(file,"utf8"));
}

logs.unshift({

id:Date.now(),

action,

performedBy,

recordId,

oldValue,

newValue,

timestamp:new Date().toLocaleString()

});

fs.writeFileSync(file,JSON.stringify(logs,null,2));

}