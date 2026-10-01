import { useEffect, useRef, useState } from 'react';
import { DEFINITIONS } from '@/lib/tool-contract';
import { deleteRecipe, exportRecipe, listRecipes, parseRecipe, recipeTemplates, runRecipe, saveRecipe, type Recipe } from '@/lib/recipes';
import { useFocusTrap } from './use-focus-trap';
import { CopyAction } from './EditorPanels';
function download(name:string,text:string){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();URL.revokeObjectURL(url);}
export function RecipePanel({onClose}:{onClose:()=>void}){
    const ref=useRef<HTMLElement>(null);useFocusTrap(true,ref,onClose);
    const [saved,setSaved]=useState(listRecipes);const [recipe,setRecipe]=useState<Recipe>(()=>recipeTemplates()[0]);
    const [input,setInput]=useState('');const [outputs,setOutputs]=useState<string[]>([]);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [undo,setUndo]=useState<Recipe|null>(null);
    const [invalidSettings,setInvalidSettings]=useState<Record<string,boolean>>({});
    const controller=useRef<AbortController|null>(null);const file=useRef<HTMLInputElement>(null);
    useEffect(()=>()=>controller.current?.abort(),[]);
    const modify=(next:Recipe)=>{setInvalidSettings(previous=>next.id!==recipe.id?{}:Object.fromEntries(next.steps.map(step=>[step.id,Boolean(previous[step.id]) && JSON.stringify(recipe.steps.find(s=>s.id===step.id)?.options)===JSON.stringify(step.options)])));setRecipe(next);setOutputs([]);};
    return <div className="tb-phase-scrim" onClick={onClose}><aside ref={ref} className="tb-phase-panel tb-recipe-panel" role="dialog" aria-modal="true" aria-labelledby="recipe-title" onClick={e=>e.stopPropagation()}>
        <header className="tb-phase-panel-header"><h2 id="recipe-title">Recipes</h2><button onClick={onClose} aria-label="Close recipes">×</button></header>
        <div className="tb-phase-panel-body">
            <p>Run repeatable transformations locally. Saved and exported recipes contain settings only, never input or intermediate output.</p>
            <label>Template<select disabled={busy} aria-label="Recipe template" value="" onChange={e=>{const r=recipeTemplates().find(r=>r.id===e.target.value);if(r)modify({...r,id:crypto.randomUUID()});}}><option value="">Choose a template</option>{recipeTemplates().map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
            <label>Name<input disabled={busy} aria-label="Recipe name" value={recipe.name} onChange={e=>modify({...recipe,name:e.target.value})}/></label>
            <ol>{recipe.steps.map((step,index)=><li key={step.id}>
                <label>Tool<select aria-label={`Step ${index+1} tool`} disabled={busy} value={step.toolId} onChange={e=>modify({...recipe,steps:recipe.steps.map((s,i)=>i===index?{...s,toolId:e.target.value,options:DEFINITIONS[e.target.value].defaultOptions}:s)})}>{Object.keys(DEFINITIONS).map(id=><option key={id}>{id}</option>)}</select></label>
                <label>Settings<textarea aria-label={`Step ${index+1} settings`} key={JSON.stringify(step.options)} disabled={busy} defaultValue={JSON.stringify(step.options)} onChange={()=>setInvalidSettings(s=>({...s,[step.id]:true}))} onBlur={e=>{try{const options=JSON.parse(e.target.value);modify({...recipe,steps:recipe.steps.map((s,i)=>i===index?{...s,options}:s)});}catch{setInvalidSettings(s=>({...s,[step.id]:true}));setMessage('Settings must be JSON.');}}}/></label>
                <button aria-label={`Move step ${index+1} up`} disabled={busy||index===0} onClick={()=>{const steps=[...recipe.steps];[steps[index-1],steps[index]]=[steps[index],steps[index-1]];modify({...recipe,steps});}}>↑</button>
                <button aria-label={`Move step ${index+1} down`} disabled={busy||index===recipe.steps.length-1} onClick={()=>{const steps=[...recipe.steps];[steps[index+1],steps[index]]=[steps[index],steps[index+1]];modify({...recipe,steps});}}>↓</button>
                <button disabled={busy} onClick={()=>modify({...recipe,steps:recipe.steps.filter(s=>s.id!==step.id)})}>Remove step</button>
                {outputs[index]!==undefined&&<details><summary>Step {index+1} output</summary><pre>{outputs[index]}</pre></details>}
            </li>)}</ol>
            <button disabled={busy} onClick={()=>modify({...recipe,steps:[...recipe.steps,{id:crypto.randomUUID(),toolId:'strip-whitespace',toolVersion:1,options:DEFINITIONS['strip-whitespace'].defaultOptions}]})}>Add step</button>
            <label>Input<textarea disabled={busy} aria-label="Recipe input" value={input} onChange={e=>setInput(e.target.value)}/></label>
            <button disabled={busy||Object.values(invalidSettings).some(Boolean)} onClick={async()=>{try{parseRecipe(JSON.stringify(recipe));controller.current=new AbortController();setBusy(true);setOutputs([]);const result=await runRecipe(recipe,input,controller.current.signal,(_,out)=>setOutputs(s=>[...s,out]));setMessage(result.result.ok?'Recipe completed.':`Stopped at step ${result.step+1}: ${result.result.code}`);}catch(e){setMessage(e instanceof Error?e.message:'Recipe failed.');}finally{setBusy(false);}}}>Run recipe</button>
            <button disabled={!busy} onClick={()=>controller.current?.abort()}>Stop</button><CopyAction text={outputs.at(-1)||''}/>
            <button disabled={busy||Object.values(invalidSettings).some(Boolean)} onClick={()=>{try{saveRecipe(recipe);setSaved(listRecipes());setMessage('Recipe saved locally.');}catch(e){setMessage(e instanceof Error?e.message:'Save failed.');}}}>Save recipe</button>
            <button disabled={busy} onClick={()=>modify({...recipe,id:crypto.randomUUID(),name:`${recipe.name} copy`})}>Duplicate</button>
            <button disabled={busy||Object.values(invalidSettings).some(Boolean)} onClick={()=>{try{download('toolbit-recipe.json',exportRecipe(recipe));}catch(e){setMessage(String(e));}}}>Export recipe</button>
            <input ref={file} type="file" accept="application/json" hidden onChange={async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>100000)throw new Error('Recipe exceeds 100 KB.');modify(parseRecipe(await f.text()));setMessage('Recipe imported; save to keep it.');}catch(error){setMessage(error instanceof Error?error.message:'Invalid recipe.');}}}/><button disabled={busy} onClick={()=>file.current?.click()}>Import recipe</button>
            <p role="status">{message}</p><h3>Saved recipes</h3>
            {saved.map(r=><div key={r.id}><button disabled={busy} onClick={()=>modify(r)}>{r.name}</button><button disabled={busy} onClick={()=>{try{deleteRecipe(r.id);setUndo(r);setSaved(listRecipes());}catch(e){setMessage(e instanceof Error?e.message:'Delete failed.');}}}>Delete recipe</button></div>)}
            {undo&&<button disabled={busy} onClick={()=>{try{saveRecipe(undo);setUndo(null);setSaved(listRecipes());}catch(e){setMessage(e instanceof Error?e.message:'Restore failed.');}}}>Undo delete</button>}
        </div>
    </aside></div>;
}
