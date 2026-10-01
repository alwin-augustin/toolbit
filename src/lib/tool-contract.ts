import Papa from 'papaparse';
import { getToolPolicy, type ToolPolicy } from './tool-policy';
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type DataType = 'text' | 'json' | 'base64' | 'csv';
export type ToolErrorCode = 'INVALID_INPUT' | 'INPUT_TOO_LARGE' | 'CANCELLED' | 'UNSUPPORTED_VERSION';
export type Result<T> = { ok: true; value: T; warning?: string } | { ok: false; code: ToolErrorCode };
export interface ToolDefinition extends ToolPolicy {
    id: string; version: number; inputType: DataType; outputType: DataType; maxInputBytes: number;
    defaultOptions: Record<string, JsonValue>;
    parse: (raw: string) => Result<string>;
    transform: (input: string, options: Record<string, JsonValue>, signal?: AbortSignal) => Promise<Result<string>>;
    serializeOptions: (options: Record<string, JsonValue>) => Record<string, JsonValue>;
}
export const INPUT_LIMIT = 10 * 1024 * 1024;
export function sortJson(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortJson);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key,v]) => [key,sortJson(v)]));
    return value;
}
export function formatJson(raw: string, indent = 2, sortKeys = false): Result<string> {
    try {
        const value = JSON.parse(raw);
        // Match complete JSON tokens, skipping quoted strings. Warn for any numeric
        // token that exceeds safe integer precision, including exponent notation.
        let unsafe=false;
        for(let i=0;i<raw.length;i++) {
            if(raw[i]==='"'){ for(i++;i<raw.length;i++){if(raw[i]==='\\'){i++;continue;}if(raw[i]==='"')break;} continue; }
            if(raw[i]==='-' || (raw[i]>='0' && raw[i]<='9')) {
                const start=i;while(i+1<raw.length && /[0-9.eE+-]/.test(raw[i+1]))i++;
                const number=Number(raw.slice(start,i+1));
                if(!Number.isFinite(number) || (Number.isInteger(number)&&!Number.isSafeInteger(number)))unsafe=true;
            }
        }
        return { ok:true, value:JSON.stringify(sortKeys ? sortJson(value) : value, null, indent), warning: unsafe ? 'Some numbers exceed JavaScript’s safe integer precision. Output may be rounded; retain the original input.' : undefined };
    } catch { return { ok:false, code:'INVALID_INPUT' }; }
}
export function base64Transform(input: string, mode: string, urlSafe: boolean): Result<string> {
    try {
        if (mode === 'decode') {
            let normalized = input.trim().replace(/-/g,'+').replace(/_/g,'/');
            normalized += '='.repeat((4 - normalized.length % 4) % 4);
            const bytes = Uint8Array.from(atob(normalized), c => c.charCodeAt(0));
            return {ok:true,value:new TextDecoder('utf-8',{fatal:true}).decode(bytes)};
        }
        const bytes = new TextEncoder().encode(input);
        let binary = ''; for (let offset=0;offset<bytes.length;offset+=32768) binary += String.fromCharCode(...bytes.subarray(offset,offset+32768));
        let value = btoa(binary); if (urlSafe) value = value.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        return {ok:true,value};
    } catch { return {ok:false,code:'INVALID_INPUT'}; }
}
export function normalizeText(input: string, action = 'normalize') {
    if (action === 'strip-all') return input.replace(/\s+/g,' ').trim();
    return input.split('\n').map(line => action === 'strip-leading' ? line.replace(/^\s+/,'') : action === 'strip-trailing' ? line.replace(/\s+$/,'') : action === 'strip-both' ? line.trim() : action === 'remove-empty' ? line : line.replace(/\s+/g,' ').trim()).filter(line => !['normalize','remove-empty'].includes(action) || line.trim()).join('\n');
}
function define(id: string, inputType: DataType, outputType: DataType, defaults: Record<string, JsonValue>, run: (raw:string, options:Record<string,JsonValue>) => Result<string> | Promise<Result<string>>): ToolDefinition {
    return { id,version:1,inputType,outputType,maxInputBytes:INPUT_LIMIT,...getToolPolicy(id),defaultOptions:defaults,
        parse: raw => new TextEncoder().encode(raw).length > INPUT_LIMIT ? {ok:false,code:'INPUT_TOO_LARGE'} : {ok:true,value:raw},
        serializeOptions: options => Object.fromEntries(Object.entries(defaults).map(([key,fallback]) => [key, typeof options[key] === typeof fallback ? options[key] : fallback])),
        async transform(raw, options, signal) { if (signal?.aborted) return {ok:false,code:'CANCELLED'}; const result = await run(raw,options); return signal?.aborted ? {ok:false,code:'CANCELLED'} : result; },
    };
}
export const DEFINITIONS: Record<string,ToolDefinition> = {
    'json-formatter':define('json-formatter','text','json',{indent:2,sortKeys:false,validateWhileTyping:true}, (raw,o) => formatJson(raw,Number(o.indent),Boolean(o.sortKeys))),
    'json-validator':define('json-validator','json','json',{}, raw => formatJson(raw)),
    'base64-encoder':define('base64-encoder','text','text',{mode:'encode',urlSafe:false},(raw,o) => base64Transform(raw,String(o.mode),Boolean(o.urlSafe))),
    'strip-whitespace':define('strip-whitespace','text','text',{action:'normalize'},(raw,o) => ({ok:true,value:normalizeText(raw,String(o.action))})),
    'csv-to-json':define('csv-to-json','csv','json',{header:true},raw => { const parsed = Papa.parse(raw,{header:true,skipEmptyLines:true}); return parsed.errors.length ? {ok:false,code:'INVALID_INPUT'} : {ok:true,value:JSON.stringify(parsed.data,null,2)}; }),
    'hash-generator':define('hash-generator','text','text',{algorithm:'SHA-256'},async raw => ({ok:true,value:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(n=>n.toString(16).padStart(2,'0')).join('')})),
};
export function inputType(step: {toolId:string;options:Record<string,JsonValue>}): DataType { return step.toolId === 'base64-encoder' && step.options.mode === 'decode' ? 'base64' : DEFINITIONS[step.toolId]?.inputType || 'text'; }
export function outputType(step: {toolId:string;options:Record<string,JsonValue>}): DataType { return step.toolId === 'base64-encoder' && step.options.mode !== 'decode' ? 'base64' : DEFINITIONS[step.toolId]?.outputType || 'text'; }
export function compatible(from: DataType, to: DataType) { return to === 'text' || from === 'text' || from === to; }
