import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

Object.defineProperty(globalThis, 'crypto', {value:webcrypto,configurable:true})
Object.defineProperty(navigator,'clipboard',{value:{writeText:vi.fn().mockResolvedValue(undefined)},configurable:true})
vi.mock('@/v2/CodeEditor', () => ({
  CodeEditor: ({value,onChange,readOnly,placeholder,label}: {value:string;onChange?:(v:string)=>void;readOnly?:boolean;placeholder?:string;label?:string}) => createElement('textarea',{
    value,readOnly,placeholder,'aria-label':label || (readOnly ? 'Output' : 'Input'),onChange:(event:{target:{value:string}})=>onChange?.(event.target.value),
  }),
}))
beforeEach(()=>{ localStorage.clear(); window.history.replaceState(null,'','/'); })
