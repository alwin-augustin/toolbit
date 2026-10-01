import { writeFile } from 'node:fs/promises';
import { DEFINITIONS } from '../src/lib/tool-contract';
const rows=[];
for(const bytes of [100*1024,1024*1024,10*1024*1024]){
    for(const id of ['json-formatter','base64-encoder','hash-generator']){
        const input=id==='json-formatter'?'"'+'x'.repeat(bytes-2)+'"':'x'.repeat(bytes);
        const values=[];
        for(let i=0;i<3;i++){const start=performance.now();const result=await DEFINITIONS[id].transform(input,DEFINITIONS[id].defaultOptions);if(!result.ok)throw new Error(`${id}: ${result.code}`);values.push(performance.now()-start);}
        rows.push({tool:id,bytes,medianMs:Math.round(values.sort((a,b)=>a-b)[1]*100)/100});
    }
}
const report={date:'2026-10-01',node:process.version,scope:'Pure transform CPU baseline; not browser interaction or worker-transfer latency',rows};
await writeFile('docs/PERFORMANCE_BASELINE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
