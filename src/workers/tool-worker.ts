import { DEFINITIONS } from '../lib/tool-contract';
self.onmessage = async (event) => {
    const { id, input, options } = event.data;
    try { const definition=DEFINITIONS[id]; if(!definition)throw new Error(); const parsed=definition.parse(input); self.postMessage(parsed.ok ? await definition.transform(parsed.value,options) : parsed); }
    catch { self.postMessage({ok:false,code:'INVALID_INPUT'}); }
};
