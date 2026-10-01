import { createContext, useEffect, useCallback, useContext, useState, type Dispatch, type SetStateAction } from 'react';
import { useWorkspace } from './workspace-store';
import type { JsonValue } from '@/lib/tool-contract';
export const DocumentContext = createContext<string|null>(null);
/** Per-document state is ephemeral until explicitly saved with include-data. */
export function useDocumentField<T extends JsonValue>(key:string, initial:T): [T,Dispatch<SetStateAction<T>>] {
    const contextId=useContext(DocumentContext); const activeId=useWorkspace(s=>s.activeTabId);
    const id=contextId||activeId;
    const document=useWorkspace(s=>s.tabs.find(d=>d.id===id));
    const [fallback,setFallback]=useState(initial);
    const stored=document?.payload?.[key];
    const value=(stored!==undefined && typeof stored===typeof initial && Array.isArray(stored)===Array.isArray(initial) ? stored : fallback) as T;
    const set=useCallback<Dispatch<SetStateAction<T>>>((next)=>{
        const current=useWorkspace.getState().tabs.find(d=>d.id===id);
        const prior=(current?.payload?.[key]??fallback) as T;
        const value=typeof next==='function'?(next as (v:T)=>T)(prior):next;
        if(current)useWorkspace.getState().patchDocument(current.id,{payload:{...current.payload,[key]:value}}); else setFallback(value);
    },[id,key,fallback]);
    return [value,set];
}
export function useDocumentOptions<T extends Record<string,JsonValue>>(defaults:T): T & {set:(patch:Partial<T>)=>void} {
    const id=useWorkspace(s=>s.activeTabId);
    const document=useWorkspace(s=>s.tabs.find(d=>d.id===id));
    const [fallback,setFallback]=useState<T>(defaults);
    return {...defaults,...fallback,...document?.options,set:(patch:Partial<T>)=>{
        if(document)useWorkspace.getState().patchDocument(document.id,{options:{...defaults,...document.options,...patch} as T});
        else setFallback(s=>({...s,...patch}));
    }};
}

const sessionFields=new Map<string,Map<string,unknown>>();
useWorkspace.subscribe(state=>{
    const retained=new Set([...state.tabs,...state.closed].map(d=>d.id));
    for(const id of sessionFields.keys())if(!retained.has(id))sessionFields.delete(id);
});
function serializable(value:unknown,depth=0):value is JsonValue {
    if(depth>40)return false;
    if(value===null || typeof value==='string' || typeof value==='boolean')return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(Array.isArray(value))return value.every(v=>serializable(v,depth+1));
    return !!value && typeof value==='object' && Object.getPrototypeOf(value)===Object.prototype && Object.values(value).every(v=>serializable(v,depth+1));
}
/** Adapter for legacy tool settings and file selections. Files stay session-only. */
export function useSessionDocumentState<T>(key:string,initial:T|(()=>T)):[T,Dispatch<SetStateAction<T>>] {
    const id=useContext(DocumentContext);
    const [value,setValue]=useState<T>(()=>{
        const saved=id?sessionFields.get(id)?.get(key):undefined;
        if(saved!==undefined)return saved as T;
        const document=id?useWorkspace.getState().tabs.find(d=>d.id===id):undefined;
        const fallback=typeof initial==='function'?(initial as ()=>T)():initial;
        const stored=document?.payload?.[`state:${key}`];
        return stored!==undefined && typeof stored===typeof fallback && Array.isArray(stored)===Array.isArray(fallback)?stored as T:fallback;
    });
    const set=useCallback<Dispatch<SetStateAction<T>>>(next=>setValue(previous=>{
        const value=typeof next==='function'?(next as (v:T)=>T)(previous):next;
        if(id){const fields=sessionFields.get(id)||new Map();fields.set(key,value);sessionFields.set(id,fields);}
        return value;
    }),[id,key]);
    // Keep store writes out of React state updater functions.
    useEffect(()=>{if(id && serializable(value)){const document=useWorkspace.getState().tabs.find(d=>d.id===id);if(document)useWorkspace.getState().patchDocument(id,{payload:{...document.payload,[`state:${key}`]:value}});}},[id,key,value]);
    return [value,set];
}
