import{r as s,j as e,f as u,h as x,z as h}from"./vendor-react-BRDxYWww.js";import{B as o}from"./index-CSjyOe-k.js";import{T as c}from"./textarea-Bf7Irmiz.js";import{C as w,a as f,b as j,c as k,d as v}from"./card-A36AAJPa.js";import{b as g,p as C}from"./vendor-data-DBwwMht3.js";import"./vendor-misc-LEklij9m.js";import"./vendor-ui-BA32w1ww.js";import"./vendor-routing-state-QrItU_Pd.js";function I(){const[r,n]=s.useState(""),[d,i]=s.useState(""),[a,l]=s.useState(!0);s.useEffect(()=>{(async()=>{try{const t=await g(r);i(C.sanitize(t))}catch(t){i(`<p class="text-red-500">Error rendering markdown: ${t instanceof Error?t.message:"Unknown error"}</p>`)}})()},[r]);const p=()=>{n(`# Sample Markdown

## Heading 2

This is a **bold** text and this is *italic* text.

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### List Example

- Item 1
- Item 2
  - Nested item
  - Another nested item

### Link Example

[Visit OpenAI](https://openai.com)

### Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data|
| Row 2    | Data     | More data|

> This is a blockquote
> It can span multiple lines`)};return e.jsxs(w,{className:"h-full",children:[e.jsxs(f,{children:[e.jsxs(j,{className:"flex items-center gap-2",children:[e.jsx(u,{className:"h-5 w-5"}),"Markdown Previewer"]}),e.jsx(k,{children:"Write Markdown and see the rendered preview"})]}),e.jsxs(v,{className:"space-y-4",children:[e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(o,{onClick:()=>l(!1),variant:a?"outline":"default","data-testid":"button-editor",children:[e.jsx(x,{className:"h-4 w-4 mr-2"}),"Editor"]}),e.jsxs(o,{onClick:()=>l(!0),variant:a?"default":"outline","data-testid":"button-preview",children:[e.jsx(h,{className:"h-4 w-4 mr-2"}),"Preview"]}),e.jsx(o,{onClick:p,variant:"outline","data-testid":"button-sample",children:"Load Sample"})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{htmlFor:"markdown-input",className:"text-sm font-medium",children:"Markdown Input"}),e.jsx(c,{id:"markdown-input",placeholder:"# Your markdown here...",value:r,onChange:m=>n(m.target.value),className:"h-80 font-mono text-sm","data-testid":"input-markdown"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-sm font-medium",children:a?"Rendered Preview":"Raw HTML"}),a?e.jsx("div",{className:"h-80 p-4 border rounded-md bg-background overflow-auto prose prose-sm dark:prose-invert max-w-none",dangerouslySetInnerHTML:{__html:d},"data-testid":"preview-markdown"}):e.jsx(c,{value:d,readOnly:!0,className:"h-80 font-mono text-sm","data-testid":"html-output"})]})]})]})]})}export{I as default};
