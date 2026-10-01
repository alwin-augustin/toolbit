import { useEffect, useState } from 'react';
/** A shared announced failure state for legacy and current copy actions. */
export function ClipboardNotice() {
    const [failed,setFailed]=useState(false);
    useEffect(()=>{const onResult=(event:Event)=>setFailed(!(event as CustomEvent<boolean>).detail);window.addEventListener('toolbit-copy-result',onResult);return()=>window.removeEventListener('toolbit-copy-result',onResult);},[]);
    return failed ? <div role="alert" className="tb-copy-notice">Copy denied. Select the output and copy manually.<button onClick={()=>setFailed(false)} aria-label="Dismiss clipboard message">×</button></div> : null;
}
