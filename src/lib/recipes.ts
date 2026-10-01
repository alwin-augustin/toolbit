import { executeTool } from './execute-tool';
import { DEFINITIONS, compatible, inputType, outputType, type JsonValue, type Result } from './tool-contract';
import { safeStorage } from './preferences';
import { track } from './telemetry';
export interface RecipeStep { id:string;toolId:string;toolVersion:1;options:Record<string,JsonValue> }
export interface Recipe { schemaVersion:1;id:string;name:string;steps:RecipeStep[] }
const key='toolbit-recipes-v1';
export function parseRecipe(raw:string): Recipe {
    if(new TextEncoder().encode(raw).length>100000)throw new Error('Recipe exceeds 100 KB.');
    const r=JSON.parse(raw);
    if(!r || r.schemaVersion!==1 || typeof r.name!=='string' || !r.name.trim() || r.name.length>200 || !Array.isArray(r.steps) || !r.steps.length || r.steps.length>50)throw new Error('Invalid or unsupported recipe.');
    const ids=new Set<string>();
    const steps=r.steps.map((s:RecipeStep)=>{
        const def=DEFINITIONS[s.toolId];
        if(!def || s.toolVersion!==1 || typeof s.id!=='string' || !s.id || ids.has(s.id) || !s.options || typeof s.options!=='object' || Array.isArray(s.options))throw new Error('Invalid recipe step or unsupported tool.');
        ids.add(s.id);
        for(const [k,v] of Object.entries(s.options))if(!(k in def.defaultOptions) || typeof v!==typeof def.defaultOptions[k])throw new Error('Invalid recipe options.');
        if(s.toolId==='base64-encoder' && !['encode','decode'].includes(String(s.options.mode)))throw new Error('Base64 mode must be encode or decode.');
        if(s.toolId==='json-formatter' && ![0,2,4,8].includes(Number(s.options.indent)))throw new Error('Invalid JSON indentation.');
        return {id:s.id,toolId:s.toolId,toolVersion:1 as const,options:def.serializeOptions(s.options)};
    });
    for(let i=1;i<steps.length;i++)if(!compatible(outputType(steps[i-1]),inputType(steps[i])))throw new Error(`Step ${i+1} does not accept the previous output type.`);
    return {schemaVersion:1,id:typeof r.id==='string'?r.id:crypto.randomUUID(),name:r.name.trim(),steps};
}
export function listRecipes(): Recipe[] { try { return JSON.parse(safeStorage.getItem(key)||'[]').map((r:unknown)=>parseRecipe(JSON.stringify(r))); } catch { return []; } }
export function saveRecipe(recipe:Recipe) { const validated=parseRecipe(JSON.stringify(recipe));const list=listRecipes().filter(r=>r.id!==validated.id);const serialized=JSON.stringify([...list,validated]);safeStorage.setItem(key,serialized);if(safeStorage.getItem(key)!==serialized)throw new Error('Recipe storage is unavailable. Export the recipe to keep it.');track('recipe_saved',{step_count:validated.steps.length,schema_version:1}); }
export function deleteRecipe(id:string){const serialized=JSON.stringify(listRecipes().filter(r=>r.id!==id));safeStorage.setItem(key,serialized);if(safeStorage.getItem(key)!==serialized)throw new Error('Recipe storage is unavailable. Deletion was not saved.');}
export function exportRecipe(recipe:Recipe){return JSON.stringify(parseRecipe(JSON.stringify(recipe)),null,2);}
export async function runRecipe(recipe:Recipe,input:string,signal?:AbortSignal,onStep?:(index:number,output:string)=>void):Promise<{result:Result<string>;step:number;outputs:string[]}> {
    const validated=parseRecipe(JSON.stringify(recipe)); let value=input;const outputs:string[]=[];
    if(listRecipes().some(r=>r.id===validated.id))track('recipe_rerun',{step_count:validated.steps.length,schema_version:1});
    for(let i=0;i<validated.steps.length;i++){
        if(signal?.aborted)return {result:{ok:false,code:'CANCELLED'},step:i,outputs};
        const step=validated.steps[i], def=DEFINITIONS[step.toolId];
        const parsed=def.parse(value);if(!parsed.ok)return {result:parsed,step:i,outputs};
        let result:Result<string>;
        try {result=await executeTool(step.toolId,parsed.value,step.options,signal);}catch{result={ok:false,code:'INVALID_INPUT'};}

        if(!result.ok)return {result,step:i,outputs};
        value=result.value;outputs.push(value);onStep?.(i,value);
        await new Promise(resolve=>setTimeout(resolve,0));
    }
    return {result:{ok:true,value},step:validated.steps.length-1,outputs};
}
function step(toolId:string,options:Record<string,JsonValue>={}):RecipeStep{return {id:crypto.randomUUID(),toolId,toolVersion:1,options:{...DEFINITIONS[toolId].defaultOptions,...options}};}
export function recipeTemplates():Recipe[]{return [
    {schemaVersion:1,id:'base64-json',name:'Base64 → JSON → Base64',steps:[step('base64-encoder',{mode:'decode'}),step('json-formatter'),step('base64-encoder',{mode:'encode'})]},
    {schemaVersion:1,id:'csv-json',name:'CSV cleanup → JSON validation',steps:[step('strip-whitespace',{action:'strip-trailing'}),step('csv-to-json'),step('json-validator')]},
    {schemaVersion:1,id:'text-hash',name:'Normalize text → SHA-256',steps:[step('strip-whitespace'),step('hash-generator')]},
];}
